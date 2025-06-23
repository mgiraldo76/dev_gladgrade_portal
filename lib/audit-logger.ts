import { query } from "@/lib/database"

interface AuditLogData {
  userId?: number
  userEmail?: string
  userName?: string
  userRole?: string
  actionType: string
  tableName?: string
  recordId?: number
  actionDescription: string
  oldValues?: any
  newValues?: any
  changedFields?: string[]
  businessContext?: string
  severityLevel?: "info" | "warning" | "error" | "critical"
  ipAddress?: string
  userAgent?: string
}

// Comprehensive audit logger for GladGrade Portal
export class AuditLogger {
  // Main logging function
  static async log(logData: AuditLogData): Promise<number | null> {
    try {
      const result = await query(
        `
        INSERT INTO audit_logs (
          user_id, user_email, user_name, user_role,
          action_type, table_name, record_id, action_description,
          old_values, new_values, changed_fields,
          ip_address, user_agent,
          business_context, severity_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `,
        [
          logData.userId || null,
          logData.userEmail || null,
          logData.userName || null,
          logData.userRole || null,
          logData.actionType,
          logData.tableName || null,
          logData.recordId || null,
          logData.actionDescription,
          logData.oldValues ? JSON.stringify(logData.oldValues) : null,
          logData.newValues ? JSON.stringify(logData.newValues) : null,
          logData.changedFields || null,
          logData.ipAddress || null,
          logData.userAgent || null,
          logData.businessContext || "general",
          logData.severityLevel || "info",
        ],
      )

      console.log(`📝 Audit log created: ${logData.actionType} - ${logData.actionDescription}`)
      return result.rows[0].id
    } catch (error) {
      console.error("❌ Failed to create audit log:", error)
      return null
    }
  }

  // Specific logging methods for common actions
  static async logProspectCreation(
    userId: number,
    userName: string,
    userRole: string,
    prospectId: number,
    prospectData: any,
  ) {
    return await AuditLogger.log({
      userId,
      userName,
      userRole,
      actionType: "CREATE",
      tableName: "prospects",
      recordId: prospectId,
      actionDescription: `Created new prospect: ${prospectData.business_name}`,
      newValues: prospectData,
      businessContext: "sales_pipeline",
      severityLevel: "info",
    })
  }

  static async logProspectOwnershipChange(
    changedByUserId: number,
    changedByName: string,
    changedByRole: string,
    prospectId: number,
    oldOwnerId: number,
    newOwnerId: number,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Log in prospect_ownership_logs table
    await query(`SELECT log_prospect_ownership_change($1, $2, $3, $4, $5, $6, $7)`, [
      prospectId,
      oldOwnerId,
      newOwnerId,
      changedByUserId,
      reason,
      ipAddress,
      userAgent,
    ])

    // Also log in main audit log
    return await AuditLogger.log({
      userId: changedByUserId,
      userName: changedByName,
      userRole: changedByRole,
      actionType: "ASSIGN",
      tableName: "prospects",
      recordId: prospectId,
      actionDescription: `Changed prospect ownership from employee ${oldOwnerId} to employee ${newOwnerId}. Reason: ${reason}`,
      businessContext: "sales_pipeline",
      severityLevel: "warning",
      ipAddress,
      userAgent,
    })
  }

  static async logProspectConversion(
    userId: number,
    userName: string,
    userRole: string,
    prospectId: number,
    clientId: number,
    conversionValue: number,
  ) {
    return await AuditLogger.log({
      userId,
      userName,
      userRole,
      actionType: "CONVERT",
      tableName: "prospects",
      recordId: prospectId,
      actionDescription: `Converted prospect ${prospectId} to client ${clientId} with value $${conversionValue}`,
      newValues: { client_id: clientId, conversion_value: conversionValue },
      businessContext: "sales_pipeline",
      severityLevel: "info",
    })
  }

  // Get recent activity for dashboard
  static async getRecentActivity(limit = 50) {
    try {
      const result = await query(
        `
        SELECT * FROM audit_logs 
        ORDER BY created_at DESC
        LIMIT $1
      `,
        [limit],
      )

      return result.rows
    } catch (error) {
      console.error("Error fetching recent activity:", error)
      return []
    }
  }
}

export default AuditLogger
