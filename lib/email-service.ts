import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import { query } from "@/lib/database"

// Email service configuration - prioritize basic SMTP
const createTransporter = (): Transporter => {
  console.log("📧 Creating email transporter...")
  console.log("SMTP_HOST:", process.env.SMTP_HOST ? "✅ Set" : "❌ Missing")
  console.log("SMTP_USER:", process.env.SMTP_USER ? "✅ Set" : "❌ Missing")
  console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "✅ Set" : "❌ Missing")
  console.log("SMTP_PORT:", process.env.SMTP_PORT || "587 (default)")

  // Always try basic SMTP first if credentials are available
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    console.log("📧 Using basic SMTP authentication")
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Add these options for better compatibility
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      debug: true, // Enable debug logging
      logger: true, // Enable logging
    })
  }

  // Fallback to OAuth2 if basic SMTP fails
  else if (
    process.env.SMTP_OAUTH_CLIENT_ID &&
    process.env.SMTP_OAUTH_CLIENT_SECRET &&
    process.env.SMTP_OAUTH_REFRESH_TOKEN
  ) {
    console.log("📧 Using OAuth2 authentication for Office365")
    return nodemailer.createTransport({
      service: "outlook",
      auth: {
        type: "OAuth2",
        user: process.env.SMTP_USER,
        clientId: process.env.SMTP_OAUTH_CLIENT_ID,
        clientSecret: process.env.SMTP_OAUTH_CLIENT_SECRET,
        refreshToken: process.env.SMTP_OAUTH_REFRESH_TOKEN,
        accessToken: process.env.SMTP_OAUTH_ACCESS_TOKEN,
      },
      debug: true,
      logger: true,
    })
  } else {
    console.error("❌ No email configuration available!")
    console.log("Available env vars:")
    console.log("- SMTP_HOST:", !!process.env.SMTP_HOST)
    console.log("- SMTP_USER:", !!process.env.SMTP_USER)
    console.log("- SMTP_PASSWORD:", !!process.env.SMTP_PASSWORD)
    console.log("- SMTP_OAUTH_CLIENT_ID:", !!process.env.SMTP_OAUTH_CLIENT_ID)

    throw new Error("No email configuration available. Please configure SMTP or OAuth2.")
  }
}

// Function to get actual client and salesman data from database using correct schema
async function getConversionData(clientId: number, prospectId?: number) {
  try {
    console.log(`🔍 Fetching conversion data for client ${clientId}, prospect ${prospectId}...`)

    // Get client data
    const clientResult = await query(`SELECT * FROM business_clients WHERE id = $1`, [clientId])

    if (clientResult.rows.length === 0) {
      throw new Error(`Client with ID ${clientId} not found`)
    }

    const client = clientResult.rows[0]
    console.log("✅ Found client:", client.business_name)

    // Get salesman data using the correct schema
    let salesman = null
    let salesmanName = "Ada Fernandez" // Default fallback

    // Method 1: If we have prospect_id, get salesman from prospect
    if (prospectId) {
      try {
        const prospectResult = await query(
          `SELECT p.*, e.full_name, e.email as employee_email
           FROM prospects p
           LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
           WHERE p.id = $1`,
          [prospectId],
        )

        console.log(`🔍 Prospect query result:`, prospectResult.rows[0])

        if (prospectResult.rows.length > 0 && prospectResult.rows[0].full_name) {
          salesman = prospectResult.rows[0]
          salesmanName = salesman.full_name
          console.log(
            "✅ Found salesman from prospect:",
            salesmanName,
            "Employee ID:",
            salesman.assigned_salesperson_id,
          )
        } else {
          console.log("⚠️ No salesman found in prospect, checking assigned_salesperson_id...")
          console.log("assigned_salesperson_id:", prospectResult.rows[0]?.assigned_salesperson_id)
        }
      } catch (error) {
        console.error("⚠️ Could not get salesman from prospect:", error)
      }
    }

    // Method 2: If no salesman yet, try from client's sales_rep_id
    if (!salesman && client.sales_rep_id) {
      try {
        const salesmanResult = await query(`SELECT full_name, email FROM employees WHERE id = $1`, [
          client.sales_rep_id,
        ])

        if (salesmanResult.rows.length > 0) {
          salesman = salesmanResult.rows[0]
          salesmanName = salesman.full_name
          console.log("✅ Found salesman from client:", salesmanName)
        }
      } catch (error) {
        console.error("⚠️ Could not get salesman from client:", error)
      }
    }

    // Method 3: If still no salesman, try from original_prospect_id
    if (!salesman && client.original_prospect_id) {
      try {
        const originalProspectResult = await query(
          `SELECT p.*, e.full_name, e.email as employee_email
           FROM prospects p
           LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
           WHERE p.id = $1`,
          [client.original_prospect_id],
        )

        if (originalProspectResult.rows.length > 0 && originalProspectResult.rows[0].full_name) {
          salesman = originalProspectResult.rows[0]
          salesmanName = salesman.full_name
          console.log("✅ Found salesman from original prospect:", salesmanName)
        }
      } catch (error) {
        console.error("⚠️ Could not get salesman from original prospect:", error)
      }
    }

    return {
      clientName: client.business_name || client.contact_name || "Valued Client",
      clientEmail: client.contact_email,
      salesmanName: salesmanName,
      salesmanEmail: salesman?.employee_email || salesman?.email,
      client: client,
      salesman: salesman,
    }
  } catch (error) {
    console.error("❌ Error fetching conversion data:", error)
    return {
      clientName: "Valued Client",
      clientEmail: "",
      salesmanName: "Ada Fernandez",
      salesmanEmail: null,
      client: null,
      salesman: null,
    }
  }
}

// Welcome email template with real data
const generateWelcomeEmail = (clientName: string, clientEmail: string, salesmanName: string) => {
  const subject = "Welcome to GladGrade — Your Portal Access is Ready!"

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GladGrade</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .feature-item { margin: 8px 0; padding: 8px; border-left: 3px solid #667eea; }
            .steps { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .step { margin: 8px 0; padding: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .contact-info { background: #e8f2ff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .emoji { font-size: 1.2em; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to GladGrade!</h1>
                <p>Your dedicated sales representative is here to help</p>
            </div>
            
            <div class="content">
                <p>Dear ${clientName},</p>
                
                <p>Welcome to GladGrade! I'm <strong>${salesmanName}</strong>, your dedicated Glad Sales Representative, and I'll be here to support you as you get started.</p>
                
                <p>Your business account has been successfully created. You can now log in to the GladGrade Portal and begin exploring the tools we've built to help you enhance customer satisfaction and showcase your service excellence.</p>
                
                <div class="steps">
                    <h3><span class="emoji">🔐</span> Getting Started is Easy:</h3>
                    <div class="step">1. Go to <strong>https://portal.gladgrade.com</strong></div>
                    <div class="step">2. Click "Log In"</div>
                    <div class="step">3. Enter your registered email: <strong>${clientEmail}</strong></div>
                    <div class="step">4. Check your inbox for a one-time verification code</div>
                    <div class="step">5. You're in!</div>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://portal.gladgrade.com" class="button">Access Your Portal</a>
                </div>
                
                <div class="features">
                    <h3><span class="emoji">💼</span> In Your Portal, You'll Be Able To:</h3>
                    <div class="feature-item"><span class="emoji">📝</span> Reply to customer reviews</div>
                    <div class="feature-item"><span class="emoji">🔧</span> Address disputes efficiently</div>
                    <div class="feature-item"><span class="emoji">📋</span> Manage your menu or service offerings (if applicable)</div>
                    <div class="feature-item"><span class="emoji">📱</span> Access and print QR codes</div>
                    <div class="feature-item"><span class="emoji">📊</span> Track your public-facing GladGrade Score (GCSG)</div>
                    <div class="feature-item"><span class="emoji">📢</span> Buy advertisement space to promote your business</div>
                    <div class="feature-item"><span class="emoji">🚀</span> …and so much more</div>
                </div>
                
                <p>If you have any questions, feel free to reach out to me directly — I'm happy to help.</p>
                
                <div class="contact-info">
                    <p><span class="emoji">📩</span> <strong>sales.support@gladgrade.com</strong></p>
                </div>
                
                <p>Looking forward to seeing your business grow through the power of customer satisfaction!</p>
                
                <p>Warmest regards,<br>
                <strong>${salesmanName}</strong><br>
                Glad Sales Representative<br>
                The GladGrade Team<br>
                <span class="emoji">🌐</span> <a href="https://www.gladgrade.com">www.gladgrade.com</a></p>
            </div>
            
            <div class="footer">
                <p>© 2024 GladGrade Holding Corporation. All rights reserved.</p>
                <p>Miami, Florida | <a href="https://www.gladgrade.com">www.gladgrade.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `

  const textContent = `
Dear ${clientName},

Welcome to GladGrade! I'm ${salesmanName}, your dedicated Glad Sales Representative, and I'll be here to support you as you get started.

Your business account has been successfully created. You can now log in to the GladGrade Portal and begin exploring the tools we've built to help you enhance customer satisfaction and showcase your service excellence.

🔐 Getting Started is Easy:
1. Go to https://portal.gladgrade.com
2. Click "Log In"
3. Enter your registered email: ${clientEmail}
4. Check your inbox for a one-time verification code
5. You're in!

💼 In Your Portal, You'll Be Able To:
📝 Reply to customer reviews
🔧 Address disputes efficiently
📋 Manage your menu or service offerings (if applicable)
📱 Access and print QR codes
📊 Track your public-facing GladGrade Score (GCSG)
📢 Buy advertisement space to promote your business
🚀 …and so much more

If you have any questions, feel free to reach out to me directly — I'm happy to help.

📩 sales.support@gladgrade.com

Looking forward to seeing your business grow through the power of customer satisfaction!

Warmest regards,
${salesmanName}
Glad Sales Representative
The GladGrade Team
🌐 www.gladgrade.com
  `

  return { subject, htmlContent, textContent }
}

// Send welcome email with real database data
export async function sendWelcomeEmail(clientName: string, clientEmail: string, clientId: number, prospectId?: number) {
  try {
    console.log(`📧 Sending welcome email to ${clientEmail} (Client ID: ${clientId}, Prospect ID: ${prospectId})...`)

    const transporter = createTransporter()

    // Get real data from database
    const conversionData = await getConversionData(clientId, prospectId)

    console.log("🔍 Conversion data:", {
      clientName: conversionData.clientName,
      salesmanName: conversionData.salesmanName,
      clientEmail: conversionData.clientEmail,
    })

    const { subject, htmlContent, textContent } = generateWelcomeEmail(
      conversionData.clientName,
      conversionData.clientEmail || clientEmail,
      conversionData.salesmanName,
    )

    // Verify transporter configuration
    console.log("🔍 Verifying email transporter...")
    await transporter.verify()
    console.log("✅ Email transporter verified successfully")

    // Send email
    const info = await transporter.sendMail({
      from: `"${conversionData.salesmanName} - GladGrade Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: conversionData.clientEmail || clientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    })

    console.log(`✅ Welcome email sent successfully: ${info.messageId}`)

    // Update email log (optional - don't fail if this doesn't work)
    try {
      await query(
        `UPDATE email_logs 
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP 
         WHERE recipient_email = $1 AND email_type = 'welcome' AND status = 'pending'`,
        [conversionData.clientEmail || clientEmail],
      )
    } catch (dbError) {
      console.error("⚠️ Failed to update email log:", dbError)
      // Don't fail the email sending if database update fails
    }

    return { success: true, messageId: info.messageId, data: conversionData }
  } catch (error) {
    console.error("❌ Error sending welcome email:", error)

    // Update email log with error (optional)
    try {
      await query(
        `UPDATE email_logs 
         SET status = 'failed', error_message = $1 
         WHERE recipient_email = $2 AND email_type = 'welcome' AND status = 'pending'`,
        [error instanceof Error ? error.message : "Unknown error", clientEmail],
      )
    } catch (dbError) {
      console.error("⚠️ Failed to update email log with error:", dbError)
    }

    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Test email function
export async function sendTestEmail(toEmail: string) {
  try {
    console.log(`📧 Sending test email to ${toEmail}...`)

    const transporter = createTransporter()

    // Verify transporter first
    console.log("🔍 Verifying email transporter...")
    await transporter.verify()
    console.log("✅ Email transporter verified successfully")

    // Use the new welcome email template for testing
    const { subject, htmlContent, textContent } = generateWelcomeEmail("Test Business", toEmail, "Ada Fernandez")

    const info = await transporter.sendMail({
      from: `"Ada Fernandez - GladGrade Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `[TEST] ${subject}`,
      text: `[THIS IS A TEST EMAIL]\n\n${textContent}`,
      html: htmlContent.replace("<h1>Welcome to GladGrade!</h1>", "<h1>[TEST] Welcome to GladGrade!</h1>"),
    })

    console.log(`✅ Test email sent successfully: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("❌ Error sending test email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Process pending emails (can be called by a cron job)
export async function processPendingEmails() {
  try {
    console.log("📧 Processing pending emails...")

    const pendingEmails = await query(
      `SELECT * FROM email_logs 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 10`,
    )

    for (const email of pendingEmails.rows) {
      if (email.email_type === "welcome") {
        await sendWelcomeEmail(email.recipient_name, email.recipient_email, email.client_id, email.prospect_id)
      }
      // Add other email types here as needed
    }

    console.log(`✅ Processed ${pendingEmails.rows.length} pending emails`)
    return { success: true, processed: pendingEmails.rows.length }
  } catch (error) {
    console.error("❌ Error processing pending emails:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
