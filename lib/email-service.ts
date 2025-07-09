// Process pending emails (can be called by a cron job)// File: lib/email-service.ts
// Enhanced email service with QR code email functionality

import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import { query } from "@/lib/database"
// Note: Remove fs and path imports as they're not needed for our implementation

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
    const result = await query(
      `SELECT 
        bc.business_name,
        bc.contact_name,
        bc.contact_email,
        bc.phone,
        e.full_name as sales_rep_name,
        e.email as sales_rep_email
       FROM business_clients bc
       LEFT JOIN employees e ON bc.sales_rep_id = e.id
       WHERE bc.id = $1`,
      [clientId]
    )

    if (result.rows.length === 0) {
      throw new Error(`Client with ID ${clientId} not found`)
    }

    const client = result.rows[0]
    return {
      clientName: client.business_name,
      clientEmail: client.contact_email,
      salesmanName: client.sales_rep_name || "GladGrade Team",
      salesmanEmail: client.sales_rep_email || process.env.SMTP_FROM
    }
  } catch (error) {
    console.error("❌ Error fetching conversion data:", error)
    return {
      clientName: "Valued Client",
      clientEmail: "",
      salesmanName: "GladGrade Team",
      salesmanEmail: process.env.SMTP_FROM || ""
    }
  }
}

// Generate welcome email template
export function generateWelcomeEmail(clientName: string, clientEmail: string, salesmanName: string) {
  const subject = `Welcome to GladGrade, ${clientName}! 🎉`

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GladGrade</title>
        <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #f97316; }
            .logo { font-size: 28px; font-weight: bold; color: #f97316; }
            .content { padding: 30px 0; }
            .cta-button { display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .features { background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GladGrade</div>
            </div>
            
            <div class="content">
                <h1>Welcome to GladGrade!</h1>
                <p>Dear ${clientName},</p>
                
                <p>Welcome to GladGrade! I'm ${salesmanName}, your dedicated Glad Sales Representative, and I'll be here to support you as you get started.</p>
                
                <p>Your business account has been successfully created. You can now log in to the GladGrade Portal and begin exploring the tools we've built to help you enhance customer satisfaction and showcase your service excellence.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://portal.gladgrade.com" class="cta-button">Access Your Portal</a>
                </div>
                
                <div class="features">
                    <h3>🚀 Getting Started is Easy:</h3>
                    <ol>
                        <li>Go to <strong>portal.gladgrade.com</strong></li>
                        <li>Click "Log In"</li>
                        <li>Enter your registered email: <strong>${clientEmail}</strong></li>
                        <li>Check your inbox for a one-time verification code</li>
                        <li>You're in!</li>
                    </ol>
                    
                    <h3>💼 In Your Portal, You'll Be Able To:</h3>
                    <ul>
                        <li>📝 Reply to customer reviews</li>
                        <li>🔧 Address disputes efficiently</li>
                        <li>📋 Manage your menu or service offerings (if applicable)</li>
                        <li>📱 Access and print QR codes</li>
                        <li>📊 Track your public-facing GladGrade Score (GCSG)</li>
                        <li>📢 Buy advertisement space to promote your business</li>
                        <li>🚀 …and so much more</li>
                    </ul>
                </div>
                
                <p>If you have any questions, feel free to reach out to me directly — I'm happy to help.</p>
                
                <p>📩 <a href="mailto:sales.support@gladgrade.com">sales.support@gladgrade.com</a></p>
                
                <p>Looking forward to seeing your business grow through the power of customer satisfaction!</p>
                
                <p>Warmest regards,<br>
                <strong>${salesmanName}</strong><br>
                Glad Sales Representative<br>
                The GladGrade Team</p>
            </div>
            
            <div class="footer">
                <p>© 2025 GladGrade. All rights reserved.</p>
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

// NEW: Generate QR Code email template
export function generateQRCodeEmail(clientName: string, salesmanName: string) {
  const subject = `Your GladGrade QR Code is Ready! 📱`

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your GladGrade QR Code</title>
        <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #f97316; }
            .logo { font-size: 28px; font-weight: bold; color: #f97316; }
            .content { padding: 30px 0; }
            .qr-section { background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .instructions { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GladGrade</div>
            </div>
            
            <div class="content">
                <h1>Your QR Code is Ready! 📱</h1>
                <p>Hi ${clientName},</p>
                
                <p>Find attached your business' QR Code. You can print it and have your clients scan it so they can GladGrade you!</p>
                
                <div class="qr-section">
                    <h3>📱 Your QR Code is Attached</h3>
                    <p>The attached PDF contains your custom QR code with professional GladGrade branding. It's ready to print and display in your business!</p>
                </div>
                
                <div class="instructions">
                    <h3>🚀 How to Use Your QR Code:</h3>
                    <ol>
                        <li><strong>Print it:</strong> Use the attached PDF to print your QR code</li>
                        <li><strong>Display it:</strong> Place it where customers can easily see and scan it</li>
                        <li><strong>Get reviews:</strong> Customers scan and are taken directly to rate your business</li>
                        <li><strong>Build reputation:</strong> Watch your GladGrade Score improve!</li>
                    </ol>
                    
                    <p><strong>💡 Pro Tip:</strong> The larger you print it, the easier it is for customers to scan. We recommend at least 3x3 inches for optimal scanning.</p>
                </div>
                
                <p>You can always contact us if you have any questions, concerns or suggestions.</p>
                
                <p>Thank you,<br>
                <strong>${salesmanName}</strong><br>
                The GladGrade Team</p>
            </div>
            
            <div class="footer">
                <p>© 2025 GladGrade. All rights reserved.</p>
                <p>Miami, Florida | <a href="https://www.gladgrade.com">www.gladgrade.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `

  const textContent = `
Hi ${clientName},

Find attached your business' QR Code. You can print it and have your clients scan it so they can GladGrade you!

🚀 How to Use Your QR Code:
1. Print it: Use the attached PDF to print your QR code
2. Display it: Place it where customers can easily see and scan it
3. Get reviews: Customers scan and are taken directly to rate your business
4. Build reputation: Watch your GladGrade Score improve!

💡 Pro Tip: The larger you print it, the easier it is for customers to scan. We recommend at least 3x3 inches for optimal scanning.

You can always contact us if you have any questions, concerns or suggestions.

Thank you,
${salesmanName}
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

// NEW: Send QR Code email with PDF attachment
export async function sendQRCodeEmail(clientId: number, qrCodeImagePath: string, employeeId: number) {
  try {
    console.log(`📧 Sending QR code email for client ${clientId}...`)

    const transporter = createTransporter()

    // Get client and employee data from database
    const conversionData = await getConversionData(clientId)
    
    // Get client business address for full layout
    const clientDetailResult = await query(
      `SELECT business_address FROM business_clients WHERE id = $1`,
      [clientId]
    )
    const businessAddress = clientDetailResult.rows[0]?.business_address || ""
    
    // Get employee data for audit trail
    const employeeResult = await query(
      `SELECT full_name, email FROM employees WHERE id = $1`,
      [employeeId]
    )
    
    const employee = employeeResult.rows[0] || { full_name: "GladGrade Team", email: "" }

    console.log("🔍 QR Code email data:", {
      clientName: conversionData.clientName,
      clientEmail: conversionData.clientEmail,
      salesmanName: conversionData.salesmanName,
      employeeName: employee.full_name,
      businessAddress: businessAddress
    })

    const { subject, htmlContent, textContent } = generateQRCodeEmail(
      conversionData.clientName,
      conversionData.salesmanName,
    )

    // Verify transporter configuration
    console.log("🔍 Verifying email transporter...")
    await transporter.verify()
    console.log("✅ Email transporter verified successfully")

    // For now, we'll include both the basic QR code and instruct the user about the full layout
    // TODO: In the future, we can implement server-side canvas generation using node-canvas
    let attachments: any[] = []
    
    if (qrCodeImagePath) {
      try {
        console.log("🔗 Processing QR code attachment:", qrCodeImagePath.substring(0, 50) + "...")
        
        // Check if it's a data URL or file path
        if (qrCodeImagePath.startsWith('data:')) {
          // It's a data URL, convert to buffer
          const base64Data = qrCodeImagePath.split(',')[1]
          if (base64Data && base64Data.length > 0) {
            const buffer = Buffer.from(base64Data, 'base64')
            
            attachments.push({
              filename: `${conversionData.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_GladGrade_QR_Code.png`,
              content: buffer,
              contentType: 'image/png'
            })
            console.log(`✅ QR code attachment prepared: ${buffer.length} bytes`)
          } else {
            console.error("❌ Empty base64 data in QR code")
          }
        } else {
          // It's a file path
          attachments.push({
            filename: `${conversionData.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_GladGrade_QR_Code.png`,
            path: qrCodeImagePath,
            contentType: 'image/png'
          })
          console.log("✅ QR code attachment prepared from file path")
        }
      } catch (attachmentError) {
        console.error("⚠️ Error preparing QR code attachment:", attachmentError)
        // Continue without attachment rather than failing the email
      }
    } else {
      console.error("❌ No QR code image path provided")
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"${conversionData.salesmanName} - GladGrade Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: conversionData.clientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: attachments
    })

    console.log(`✅ QR code email sent successfully: ${info.messageId}`)

    // Log the email send to database
    try {
      await query(
        `INSERT INTO email_logs (
          recipient_email, recipient_name, email_type, subject, 
          client_id, employee_id, status, sent_at, template_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)`,
        [
          conversionData.clientEmail,
          conversionData.clientName,
          'qr_code',
          subject,
          clientId,
          employeeId,
          'sent',
          'qr_code_template'
        ]
      )
      console.log("✅ Email logged to database")
    } catch (dbError) {
      console.error("⚠️ Failed to log email to database:", dbError)
      // Don't fail the email sending if database logging fails
    }

    return { 
      success: true, 
      messageId: info.messageId, 
      data: conversionData,
      attachmentCount: attachments.length
    }
  } catch (error) {
    console.error("❌ Error sending QR code email:", error)

    // Log the error to database
    try {
      const conversionData = await getConversionData(clientId)
      await query(
        `INSERT INTO email_logs (
          recipient_email, recipient_name, email_type, subject, 
          client_id, employee_id, status, error_message, template_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          conversionData.clientEmail,
          conversionData.clientName,
          'qr_code',
          'Your GladGrade QR Code is Ready!',
          clientId,
          employeeId,
          'failed',
          error instanceof Error ? error.message : "Unknown error",
          'qr_code_template'
        ]
      )
    } catch (dbError) {
      console.error("⚠️ Failed to log email error to database:", dbError)
    }

    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Helper function to create full layout QR code
async function createFullLayoutQRCode(qrCodeDataURL: string, businessName: string, businessAddress: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      // Create a canvas to render the full layout
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size for print quality (300 DPI equivalent)
      canvas.width = 1050 // 3.5 inches at 300 DPI
      canvas.height = 1350 // 4.5 inches at 300 DPI
      
      if (ctx) {
        // Fill white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw border
        ctx.strokeStyle = '#f97316'
        ctx.lineWidth = 6
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)
        
        let yPosition = 60
        
        // 1. Load and draw GladGrade logo at the very top, centered
        const logoImage = new Image()
        logoImage.onload = () => {
          // Draw logo centered at top
          const logoSize = 105 // 35px * 3 for high-res
          const logoX = (canvas.width - logoSize) / 2
          ctx.drawImage(logoImage, logoX, yPosition, logoSize, logoSize)
          
          yPosition += logoSize + 30
          
          // 2. Draw "GLADGRADE ME" title (no space)
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f97316'
          ctx.font = 'bold 54px Arial'
          ctx.fillText('GLADGRADE ME', canvas.width / 2, yPosition)
          
          yPosition += 40
          
          // 3. Draw business name
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 48px Arial'
          ctx.fillText(businessName.toUpperCase(), canvas.width / 2, yPosition)
          
          yPosition += 60
          
          // 4. Load and draw QR code
          const qrImage = new Image()
          qrImage.onload = () => {
            const qrSize = 450 // Large QR code for scanning
            const qrX = (canvas.width - qrSize) / 2
            ctx.drawImage(qrImage, qrX, yPosition, qrSize, qrSize)
            
            yPosition += qrSize + 30
            
            // 5. Draw business address if available
            if (businessAddress) {
              ctx.fillStyle = '#666666'
              ctx.font = '36px Arial'
              const addressLines = businessAddress.split(',')
              for (const line of addressLines) {
                ctx.fillText(line.trim(), canvas.width / 2, yPosition)
                yPosition += 40
              }
              yPosition += 20
            }
            
            // 6. Instructions - properly sized to fit horizontally
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(60, yPosition, canvas.width - 120, 70)
            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 2
            ctx.strokeRect(60, yPosition, canvas.width - 120, 70)
            
            ctx.fillStyle = '#666666'
            ctx.font = '26px Arial' // Reduced font size to fit
            ctx.fillText('1. Open Camera • 2. Scan Code • 3. Open/Download App • 4. Grade this Business', canvas.width / 2, yPosition + 45)
            
            yPosition += 90
            
            // Footer
            ctx.strokeStyle = '#e5e7eb'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(100, yPosition)
            ctx.lineTo(canvas.width - 100, yPosition)
            ctx.stroke()
            
            ctx.fillStyle = '#999999'
            ctx.font = '24px Arial'
            ctx.fillText('Powered by GladGrade • www.gladgrade.com', canvas.width / 2, yPosition + 35)
            
            // Convert canvas to buffer
            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader()
                reader.onload = () => {
                  const arrayBuffer = reader.result as ArrayBuffer
                  resolve(Buffer.from(arrayBuffer))
                }
                reader.readAsArrayBuffer(blob)
              } else {
                resolve(null)
              }
            }, 'image/png')
          }
          
          qrImage.src = qrCodeDataURL
        }
        
        // Try to load the GladGrade logo, fallback if not available
        logoImage.onerror = () => {
          // Skip logo and continue with the rest
          yPosition = 60
          
          // 2. Draw "GLADGRADE ME" title (no space)
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f97316'
          ctx.font = 'bold 54px Arial'
          ctx.fillText('GLADGRADE ME', canvas.width / 2, yPosition)
          
          yPosition += 40
          
          // Continue with the rest of the layout...
          const qrImage = new Image()
          qrImage.onload = () => {
            // Same QR code drawing logic as above
            ctx.fillStyle = '#333333'
            ctx.font = 'bold 48px Arial'
            ctx.fillText(businessName.toUpperCase(), canvas.width / 2, yPosition)
            
            yPosition += 60
            
            const qrSize = 450
            const qrX = (canvas.width - qrSize) / 2
            ctx.drawImage(qrImage, qrX, yPosition, qrSize, qrSize)
            
            yPosition += qrSize + 90
            
            // Instructions
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(60, yPosition, canvas.width - 120, 70)
            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 2
            ctx.strokeRect(60, yPosition, canvas.width - 120, 70)
            
            ctx.fillStyle = '#666666'
            ctx.font = '26px Arial'
            ctx.fillText('1. Open Camera • 2. Scan Code • 3. Open/Download App • 4. Grade this Business', canvas.width / 2, yPosition + 45)
            
            yPosition += 90
            
            // Footer
            ctx.strokeStyle = '#e5e7eb'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(100, yPosition)
            ctx.lineTo(canvas.width - 100, yPosition)
            ctx.stroke()
            
            ctx.fillStyle = '#999999'
            ctx.font = '24px Arial'
            ctx.fillText('Powered by GladGrade • www.gladgrade.com', canvas.width / 2, yPosition + 35)
            
            // Convert to buffer
            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader()
                reader.onload = () => {
                  const arrayBuffer = reader.result as ArrayBuffer
                  resolve(Buffer.from(arrayBuffer))
                }
                reader.readAsArrayBuffer(blob)
              } else {
                resolve(null)
              }
            }, 'image/png')
          }
          qrImage.src = qrCodeDataURL
        }
        
        // Load the GladGrade logo
        logoImage.src = '/images/gladgrade-logo.png'
      } else {
        resolve(null)
      }
    } catch (error) {
      console.error("Error creating full layout QR code:", error)
      resolve(null)
    }
  })
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