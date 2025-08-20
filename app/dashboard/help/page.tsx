// File: app/dashboard/help/page.tsx
// Name: Help & Support Knowledge Base

"use client"

import { useState, useEffect, useMemo } from "react"

import {
  Search,
  Book,
  Users,
  BarChart3,
  MessageSquare,
  ConciergeBell,
  Utensils,
  User,
  TrendingUp,
  Building,
  Heart,
  Database,
  ShieldCheck,
  ImageIcon,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Settings,
  CreditCard,
  Menu,
  Target,
  FileText,
  HelpCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"



import { useAuth } from "@/app/providers"


// Knowledge Base Data Structure
const CLIENT_ARTICLES = [
  {
    id: "dashboard-overview",
    title: "Dashboard Overview",
    category: "Getting Started",
    icon: BarChart3,
    tags: ["dashboard", "overview", "metrics", "analytics"],
    summary: "Understanding your business dashboard and key metrics",
    content: `
# Dashboard Overview

Your GladGrade Dashboard is your command center for managing customer feedback and business performance.

## What You'll See

**Key Metrics Cards:**
- **GCSG Score**: Your GladGrade Customer Satisfaction Grade (0-100)
- **Total Reviews**: Overall review count across all platforms
- **Average Rating**: Your average star rating
- **Monthly Growth**: Review volume trends

**Recent Reviews Section:**
- Latest customer feedback
- Quick response options
- Sentiment analysis indicators

**Performance Charts:**
- Review trends over time
- Rating distribution
- Response time metrics

## Dashboard Features

**Quick Actions:**
- Respond to reviews directly
- Generate QR codes
- View detailed reports
- Access team management

**Notifications:**
- New review alerts
- Response reminders
- System updates
- Service notifications

## Who Can Access
- **Client Admin**: Full dashboard access
- **Client Moderator**: Review management focus
- **Client User**: Basic metrics view
- **Client Viewer**: Read-only access

Your dashboard updates in real-time as new reviews come in and your team responds to customer feedback.
    `
  },

  {
    id: "claim-business",
    title: "Claim Your Business",
    category: "Getting Started",
    icon: Building,
    tags: ["claim", "business", "verification", "ownership", "setup"],
    summary: "How to claim and verify ownership of your business on GladGrade",
    content: `
  # Claim Your Business
  
  Business claiming allows you to take control of your business profile on GladGrade and access all portal features.
  
  ## What is Business Claiming?
  
  **Business Claiming Process:**
  - Verify you own or manage a business
  - Gain access to GladGrade portal features
  - Control your business information and reviews
  - Access analytics and management tools
  
  **Why Claim Your Business:**
  - Respond to customer reviews
  - Manage your online reputation
  - Access detailed analytics
  - Use GladGrade services and tools
  - Control your business information
  
  ## How to Claim Your Business
  
  **Step 1: Search for Your Business**
  1. Go to the GladGrade login page
  2. Click "Claim Your Business"
  3. Search by business name or address
  4. Select your business from results
  
  **Step 2: Verify Ownership**
  Choose one of these verification methods:
  - **Phone Verification**: Receive a call at your business number
  - **Email Verification**: Get verification email at business email
  - **Document Upload**: Provide business license or utility bill
  - **Postcard Verification**: Receive mailed verification code
  
  **Step 3: Complete Setup**
  1. Confirm business information
  2. Set up your account credentials
  3. Choose your subscription plan
  4. Complete portal onboarding
  
  ## Verification Methods
  
  **Phone Verification (Fastest):**
  - Automated call to your business phone
  - Enter verification code provided
  - Instant access upon confirmation
  
  **Email Verification:**
  - Email sent to registered business email
  - Click verification link
  - Complete account setup
  
  **Document Verification:**
  Upload one of these documents:
  - Business license
  - Utility bill (recent)
  - Tax document with business name
  - Official business correspondence
  
  **Postcard Verification:**
  - Physical postcard mailed to business address
  - Contains unique verification code
  - Takes 5-7 business days
  
  ## After Claiming
  
  **Immediate Access:**
  - Business dashboard
  - Review management
  - Basic analytics
  - Profile editing
  
  **Setup Next Steps:**
  1. Complete business profile
  2. Add team members
  3. Configure notifications
  4. Set up review responses
  5. Generate QR codes
  
  ## Common Issues
  
  **Business Not Found:**
  - Try different search terms
  - Check address variations
  - Contact support for manual addition
  
  **Verification Problems:**
  - Ensure phone/email are current
  - Check spam folders for emails
  - Verify business documents are clear
  - Try alternative verification method
  
  **Multiple Locations:**
  - Claim each location separately
  - Use location-specific verification
  - Set up multi-location management
  - Coordinate team access
  
  ## Security and Ownership
  
  **Ownership Verification:**
  - Only authorized business representatives can claim
  - Verification required for account access
  - Documentation may be required
  - Regular ownership confirmation
  
  **Account Security:**
  - Strong password requirements
  - Two-factor authentication available
  - Team member access controls
  - Regular security updates
  
  ## Support During Claiming
  
  **Available Help:**
  - Email support during process
  - Phone assistance for complex cases
  - Documentation guides
  - Video tutorials
  
  **Common Questions:**
  - "How long does verification take?" - Usually instant to 24 hours
  - "Can I claim multiple businesses?" - Yes, with separate verifications
  - "What if verification fails?" - Try alternative methods or contact support
  
  ## Next Steps After Claiming
  
  **Essential Setup:**
  1. Complete business information
  2. Set up review monitoring
  3. Configure team access
  4. Choose service packages
  5. Start using GladGrade tools
  
  Business claiming is your first step to taking control of your online reputation and customer satisfaction management.
    `
  },
  {
    id: "reviews-management",
    title: "Reviews Management",
    category: "Core Features",
    icon: MessageSquare,
    tags: ["reviews", "responses", "moderation", "feedback"],
    summary: "Managing customer reviews, responses, and feedback",
    content: `
# Reviews Management

The Reviews section is where you manage all customer feedback across multiple platforms and locations.

## What Reviews Include

**Review Sources:**
- Google Reviews
- Facebook Reviews
- Yelp Reviews
- Direct portal feedback
- QR code submissions

**Review Information:**
- Customer name and rating (1-5 stars)
- Review text and photos
- Date submitted
- Platform source
- Location (for multi-location businesses)

## Review Management Features

**Filtering and Search:**
- Filter by rating (1-5 stars)
- Search by keywords
- Filter by date range
- Filter by location
- Filter by response status

**Response Management:**
- Draft and send responses
- Use response templates
- Track response times
- Set response reminders

**Team Collaboration:**
- Assign reviews to team members
- Internal notes on reviews
- Response approval workflows
- Performance tracking

## Response Best Practices

**Quick Response Guidelines:**
- Respond within 24 hours when possible
- Thank customers for positive feedback
- Address concerns professionally
- Offer solutions for negative reviews

**Template Responses:**
- Pre-written responses for common scenarios
- Customizable for your business tone
- Available for positive and negative reviews

## Who Can Do What

**Client Admin:**
- View all reviews
- Respond to reviews
- Manage response templates
- Assign reviews to team members
- View analytics

**Client Moderator:**
- View and respond to reviews
- Use templates
- See team performance

**Client User:**
- View assigned reviews
- Respond using templates
- Basic analytics

**Client Viewer:**
- View reviews only
- No response capabilities

Reviews are automatically organized by priority, with recent negative reviews appearing first to ensure quick attention.
    `
  },
  {
    id: "reports-analytics",
    title: "Reports & Analytics",
    category: "Analytics",
    icon: BarChart3,
    tags: ["reports", "analytics", "data", "insights", "download"],
    summary: "Understanding your business performance through detailed reports",
    content: `
# Reports & Analytics

The Reports section provides comprehensive insights into your business performance and customer satisfaction trends.

## Available Reports

**Review Performance Reports:**
- Review volume over time
- Average rating trends
- Response time analytics
- Platform performance comparison

**Customer Satisfaction Reports:**
- GCSG score history
- Rating distribution analysis
- Sentiment analysis trends
- Customer feedback themes

**Team Performance Reports:**
- Response times by team member
- Review assignment distribution
- Response quality metrics
- Team productivity analytics

**Location Performance:**
(For multi-location businesses)
- Performance by location
- Comparative location analysis
- Location-specific trends

## Report Features

**Customizable Date Ranges:**
- Last 30 days
- Last 3 months
- Last 6 months
- Last year
- Custom date selection

**Export Options:**
- PDF reports for presentations
- Excel exports for further analysis
- CSV data for custom reporting
- Scheduled email reports

**Visual Analytics:**
- Interactive charts and graphs
- Trend line analysis
- Comparative visualizations
- Mobile-responsive dashboards

## Current Development Status

🚧 **Under Development**: Advanced reporting features are currently being enhanced with:
- Real-time report generation
- Advanced filtering options
- Custom report builder
- API integration for third-party tools
- Automated insight recommendations

**Coming Soon:**
- Competitor analysis reports
- Industry benchmarking
- Predictive analytics
- Custom KPI tracking

## Access Levels

**Client Admin & Client Moderator:**
- Full access to all reports
- Export capabilities
- Historical data access

**Client User:**
- Basic performance reports
- Limited export options

**Client Viewer:**
- View-only access to standard reports

Reports are updated in real-time as new data becomes available, ensuring you always have the latest insights into your business performance.
    `
  },
  {
    id: "team-management",
    title: "Team Management",
    category: "Administration",
    icon: Users,
    tags: ["team", "users", "permissions", "roles", "access"],
    summary: "Managing team members, roles, and permissions",
    content: `
# Team Management

Team Management allows you to control who has access to your GladGrade portal and what they can do.

## User Roles

**Client Admin:**
- Full access to all features
- Can add/remove team members
- Manage user permissions
- Access billing and settings
- View all analytics

**Client Moderator:**
- Manage reviews and responses
- View analytics and reports
- Cannot manage billing or add users
- Can assign reviews to team members

**Client User:**
- Respond to assigned reviews
- View basic analytics
- Use response templates
- Cannot manage other users

**Client Viewer:**
- Read-only access
- View reviews and analytics
- Cannot respond or make changes
- Good for stakeholders who need visibility

## Adding Team Members

**Step-by-Step Process:**
1. Go to Team Management
2. Click "Add Team Member"
3. Enter their email address
4. Select their role
5. Choose permissions
6. Send invitation

**Invitation Process:**
- Team member receives email invitation
- They create their own password
- Account is activated upon first login
- Admin receives confirmation

## Managing Existing Members

**User Management Options:**
- Edit user roles and permissions
- Suspend or reactivate accounts
- Reset user passwords
- View user activity logs
- Transfer review assignments

**Permission Management:**
- Customize access levels
- Set location restrictions (multi-location)
- Control feature access
- Set review response limits

## Activity Monitoring

**Track Team Performance:**
- Response times by user
- Number of reviews handled
- Response quality metrics
- Login and activity logs

**Notifications:**
- New user registrations
- Permission changes
- Account suspensions
- Security alerts

## Security Features

**Account Security:**
- Two-factor authentication options
- Password complexity requirements
- Session timeout controls
- IP address restrictions

**Audit Trail:**
- All user actions logged
- Permission change history
- Login attempt tracking
- Data access logs

## Best Practices

**Role Assignment:**
- Start with minimal permissions
- Increase access as needed
- Regular permission reviews
- Clear role documentation

**Team Training:**
- Provide initial portal training
- Share response guidelines
- Regular check-ins
- Performance feedback

## Who Can Manage Teams

**Client Admin Only:**
- Full team management capabilities
- Only role that can add/remove users
- Complete permission control
- Billing and account management

Team Management ensures your customer service remains consistent and professional across all team members while maintaining proper security and access controls.
    `
  },
  {
    id: "service-management",
    title: "Service Management",
    category: "Services",
    icon: ConciergeBell,
    tags: ["services", "billing", "subscriptions", "features", "upgrades"],
    summary: "Managing your GladGrade services, subscriptions, and features",
    content: `
# Service Management

Service Management is where you control your GladGrade subscriptions, add-on features, and billing.

## Available Services

**Dashboard & Analytics:**
- Basic Dashboard ($29.99/month): Essential metrics and feedback overview
- Premium Dashboard ($79.99/month): Advanced analytics with custom reports
- Enterprise Dashboard ($199.99/month): Full business intelligence suite with API access

**Marketing & Advertising:**
- Sponsored Listing ($49.99): Boost visibility in search results
- Featured Business Badge ($19.99/month): Premium quality highlighting
- Social Media Integration ($39.99/month): Connect social accounts

**QR Code Services:**
- Basic QR Codes ($9.99): Simple feedback collection codes
- Premium QR Package ($24.99): Custom branded codes with analytics
- QR Management Suite ($15.99/month): Advanced tracking and management

**Premium Features:**
- Review Response Tools ($34.99/month): Automated response management
- Competitor Analysis ($59.99/month): Monitor competitor performance
- White Label Solution ($299.99/month): Custom branded portal

**Consulting Services:**
- Business Consultation ($150): One-on-one expert consultation
- GCSG Improvement Plan ($199.99): Customized improvement strategy
- Training & Onboarding ($99.99): Comprehensive staff training

## Managing Your Services

**Current Services:**
- View active subscriptions
- Check service status
- See usage statistics
- Monitor billing cycles

**Adding Services:**
1. Browse available services
2. Read service descriptions
3. Check pricing and features
4. Add to cart
5. Complete purchase

**Service Configuration:**
- Configure service settings
- Set up integrations
- Customize features
- Monitor usage limits

## Billing Management

**Subscription Management:**
- View upcoming charges
- Change billing cycles
- Update payment methods
- Download invoices

**Usage Monitoring:**
- Track service usage
- Monitor feature limits
- View overage charges
- Get usage alerts

**Payment Options:**
- Credit/debit cards
- ACH bank transfers
- Monthly or annual billing
- Enterprise custom billing

## Service Categories

**Essential Services:**
Required for basic portal functionality:
- GladGrade Portal Access
- Basic Review Management
- Standard QR Codes

**Growth Services:**
For expanding businesses:
- Premium Analytics
- Marketing Tools
- Advanced QR Features

**Enterprise Services:**
For large organizations:
- White Label Solutions
- API Access
- Custom Integrations
- Dedicated Support

## Support & Training

**Included Support:**
- Email support for all plans
- Knowledge base access
- Video tutorials
- Community forums

**Premium Support:**
- Phone support (Premium plans)
- Priority response times
- Dedicated account manager (Enterprise)
- Custom training sessions

## Service Recommendations

**For New Businesses:**
- Start with Basic Dashboard
- Add Premium QR Package
- Consider Review Response Tools

**For Growing Businesses:**
- Upgrade to Premium Dashboard
- Add Marketing services
- Implement team features

**For Enterprise:**
- Enterprise Dashboard
- White Label Solution
- Full consulting package

## Who Can Manage Services

**Client Admin Only:**
- Full service management
- Billing control
- Purchase new services
- Cancel subscriptions

Service changes take effect immediately upon purchase, and you can upgrade or downgrade services at any time through your portal.
    `
  },
  {
    id: "gladmenu-guide",
    title: "GladMenu Complete Guide",
    category: "GladMenu",
    icon: Utensils,
    tags: ["menu", "items", "categories", "pricing", "qr", "mobile", "customization"],
    summary: "Complete guide to creating and managing your digital menu",
    content: `
# GladMenu Complete Guide

GladMenu is your comprehensive digital menu management system, perfect for restaurants, retail stores, service providers, and any business that offers products or services.

## Getting Started with GladMenu

**Initial Setup:**
1. Access GladMenu from your dashboard
2. Choose your business type (Restaurant, Retail, Services, etc.)
3. Set up your basic menu structure
4. Configure your branding and styling

**Business Types Supported:**
- Restaurants & Food Service
- Retail & Product Catalogs
- Professional Services
- Healthcare Services
- Automotive Services
- And many more

## Menu Structure & Organization

**Categories:**
- Create logical groupings for your items
- Use custom colors and icons
- Set display order and visibility
- Enable/disable categories seasonally

**Items Management:**
- Add detailed item information
- Include high-quality images
- Set pricing and availability
- Add descriptions and allergen info

**Menu Templates:**
- Choose from pre-designed layouts
- Customize colors and fonts
- Upload your logo and branding
- Mobile-optimized designs

## Advanced Features

**Multi-Location Support:**
- Different menus per location
- Location-specific pricing
- Local availability settings
- Coordinated branding

**Dynamic Pricing:**
- Time-based pricing (happy hour, lunch specials)
- Seasonal adjustments
- Promotional pricing
- Bulk discounts

**Inventory Integration:**
- Real-time availability updates
- Out-of-stock notifications
- Automatic item hiding
- Restock alerts

## Mobile Experience

**QR Code Generation:**
- Custom branded QR codes
- Multiple QR types (menu, location, reviews)
- Print-ready formats
- Analytics tracking

**Mobile Optimization:**
- Fast loading times
- Touch-friendly interface
- Offline viewing capability
- Share menu via social media

**Customer Features:**
- Search and filter items
- View nutritional information
- Check allergen warnings
- Direct ordering (if enabled)

## Customization Options

**Visual Styling:**
- Brand colors and fonts
- Custom CSS support
- Image galleries
- Video content

**Layout Options:**
- Grid vs. list views
- Single vs. multi-column
- Category tabs or scrolling
- Featured item highlights

**Interactive Elements:**
- Item detail modals
- Image zoom functionality
- Social sharing buttons
- Customer feedback forms

## Publishing & Sharing

**Publishing Options:**
- Instant live updates
- Scheduled publishing
- Draft mode for testing
- Version control

**Sharing Methods:**
- QR codes for table tents
- Website embed codes
- Social media links
- Email marketing integration

**SEO Optimization:**
- Search engine friendly URLs
- Meta descriptions
- Image alt tags
- Local SEO optimization

## Analytics & Insights

**Menu Performance:**
- Most viewed items
- Customer interaction data
- Peak viewing times
- Mobile vs. desktop usage

**Customer Behavior:**
- Popular search terms
- Category preferences
- Session duration
- Bounce rates

**QR Code Analytics:**
- Scan frequency
- Location performance
- Time-based patterns
- Device types

## Integration Features

**Review Integration:**
- Connect with review platforms
- Display ratings on items
- Customer feedback collection
- Response management

**Social Media:**
- Instagram feed integration
- Facebook menu posting
- Social sharing buttons
- User-generated content

**Third-Party Services:**
- POS system integration
- Online ordering platforms
- Delivery service connections
- Payment processing

## Advanced Management

**Bulk Operations:**
- Import/export menu data
- Bulk price updates
- Category reassignments
- Mass image uploads

**Team Collaboration:**
- Multiple user access
- Role-based permissions
- Content approval workflows
- Change notifications

**Backup & Recovery:**
- Automatic backups
- Version history
- Content restoration
- Data export options

## Best Practices

**Content Creation:**
- Use high-quality images
- Write compelling descriptions
- Keep pricing current
- Regular content updates

**User Experience:**
- Simple navigation
- Fast loading times
- Clear categorization
- Mobile-first design

**Maintenance:**
- Regular content audits
- Performance monitoring
- Customer feedback review
- Feature updates

## Who Can Use GladMenu

**Client Admin:**
- Full menu creation and editing
- Publishing controls
- Analytics access
- Team management

**Requirements:**
- Active GladGrade subscription
- Client Admin role
- Business verification

GladMenu transforms your traditional menu into a dynamic, interactive digital experience that enhances customer engagement and streamlines your business operations.

## Getting Help

**Support Resources:**
- Video tutorials
- Step-by-step guides
- Template library
- Best practice examples

**Technical Support:**
- Email support included
- Priority support for premium plans
- Custom training available
- Implementation assistance

Start with a simple menu structure and gradually add advanced features as you become more comfortable with the system.
    `
  },
  {
    id: "profile-settings",
    title: "Profile & Settings",
    category: "Account",
    icon: User,
    tags: ["profile", "settings", "account", "security", "preferences"],
    summary: "Managing your account information, preferences, and security settings",
    content: `
# Profile & Settings

Your Profile & Settings section controls your personal account information, security preferences, and portal customization.

## Personal Information

**Basic Profile:**
- Full name and contact information
- Email address and phone number
- Job title and department
- Profile photo upload

**Business Information (Client Accounts):**
- Business name and type
- Industry category
- Number of locations
- Business contact details

**Account Verification:**
- Email verification status
- Phone verification
- Business verification (for clients)
- Identity confirmation

## Security Settings

**Password Management:**
- Change password
- Password strength requirements
- Password history tracking
- Account lockout protection

**Two-Factor Authentication:**
- SMS verification
- Authenticator app support
- Backup codes generation
- Device management

**Login Security:**
- Session management
- Active device monitoring
- Login attempt tracking
- Suspicious activity alerts

## Notification Preferences

**Email Notifications:**
- New review alerts
- Team activity updates
- System notifications
- Marketing communications

**Portal Notifications:**
- In-app alerts
- Desktop notifications
- Mobile push notifications
- Notification frequency settings

**Custom Alerts:**
- Rating threshold alerts
- Response time reminders
- Service usage notifications
- Billing reminders

## Portal Preferences

**Display Settings:**
- Theme selection (Light/Dark)
- Language preferences
- Timezone settings
- Date format preferences

**Dashboard Customization:**
- Widget arrangements
- Default views
- Quick action preferences
- Data refresh intervals

**Accessibility Options:**
- Font size adjustments
- High contrast mode
- Screen reader compatibility
- Keyboard navigation

## Privacy Controls

**Data Privacy:**
- Data sharing preferences
- Analytics opt-out options
- Third-party integrations
- Data retention settings

**Communication Preferences:**
- Contact method preferences
- Marketing opt-in/out
- Survey participation
- Feedback collection

## Account Management

**Subscription Information:**
- Current plan details
- Usage statistics
- Billing information
- Service add-ons

**Team Integration:**
- Role assignments
- Permission levels
- Team notifications
- Collaboration settings

**Data Management:**
- Export account data
- Data backup options
- Account deletion process
- Data recovery procedures

## Business Settings (Client Accounts)

**Business Profile:**
- Business description
- Operating hours
- Service areas
- Contact information

**Brand Management:**
- Logo upload
- Brand colors
- Marketing materials
- Social media links

**Location Management:**
- Multiple location setup
- Location-specific settings
- Service area mapping
- Contact information per location

## Integration Settings

**Third-Party Connections:**
- Social media accounts
- Review platform integrations
- Email marketing tools
- Analytics services

**API Configuration:**
- API key management
- Webhook settings
- Data synchronization
- Custom integrations

## Support & Help

**Help Resources:**
- Knowledge base access
- Video tutorials
- FAQ sections
- Contact support options

**Account Support:**
- Technical assistance
- Billing support
- Training resources
- Feature requests

## Backup & Recovery

**Account Backup:**
- Regular data backups
- Export capabilities
- Restoration options
- Version history

**Emergency Access:**
- Account recovery methods
- Emergency contacts
- Backup verification
- Security questions

## Who Can Access

**Individual Settings:**
- Each user manages their own profile
- Personal preferences are private
- Security settings are individual

**Business Settings (Client Admin only):**
- Business information management
- Team-wide settings
- Integration configurations
- Billing and subscription management

Regular review and updates of your profile settings ensure optimal security and personalized experience with the GladGrade portal.
    `
  }
]

const EMPLOYEE_ARTICLES = [
  {
    id: "employee-dashboard",
    title: "Employee Dashboard Overview",
    category: "Getting Started",
    icon: BarChart3,
    tags: ["dashboard", "overview", "metrics", "employee"],
    summary: "Understanding the employee dashboard based on your role and permissions",
    content: `
# Employee Dashboard Overview

The Employee Dashboard provides role-specific access to GladGrade's internal tools and client management features.

## Role-Based Access

Your dashboard content depends on your department, role, and permissions:

**Super Admin:**
- Complete system access
- All department views
- User management tools
- System configuration

**Admin:**
- Administrative functions
- User management
- Reports and settings
- Limited system access

**Employee Roles:**
- Sales: Client pipeline and prospects
- Support: Client assistance tools
- Moderator: Content moderation
- Finance: Billing and commissions

## Common Dashboard Elements

**Quick Stats:**
- Personal performance metrics
- Daily/weekly targets
- Recent activity summary
- Pending tasks

**Notifications:**
- Assigned tasks
- System alerts
- Client updates
- Team communications

**Recent Activity:**
- Client interactions
- System changes
- Team updates
- Personal achievements

## Department-Specific Views

**Sales Department:**
- Prospect pipeline
- Commission tracking
- Client conversion metrics
- Sales performance

**Support Department:**
- Client tickets
- Response times
- Satisfaction scores
- Help requests

**Content Moderation:**
- Review queue
- Flagged content
- Approval workflows
- Moderation statistics

## Navigation Structure

Your sidebar shows only the sections you have permission to access based on your role and department assignments.
    `
  },
  {
    id: "claim-business-employee",
    title: "Claim Your Business (Client Guide)",
    category: "Client Support",
    icon: Building,
    tags: ["claim", "business", "verification", "ownership", "setup", "client"],
    summary: "Guide for helping clients claim and verify ownership of their business on GladGrade",
    content: `
  # Claim Your Business (Client Guide)
  
  This guide helps you assist clients with claiming and verifying ownership of their business on GladGrade.
  
  ## What is Business Claiming?
  
  **Business Claiming Process:**
  - Clients verify they own or manage a business
  - Gain access to GladGrade portal features
  - Control their business information and reviews
  - Access analytics and management tools
  
  **Why Clients Should Claim Their Business:**
  - Respond to customer reviews
  - Manage their online reputation
  - Access detailed analytics
  - Use GladGrade services and tools
  - Control their business information
  
  ## How Clients Claim Their Business
  
  **Step 1: Search for Business**
  1. Direct clients to the GladGrade login page
  2. Have them click "Claim Your Business"
  3. Search by business name or address
  4. Select their business from results
  
  **Step 2: Verify Ownership**
  Help clients choose verification methods:
  - **Phone Verification**: Receive a call at business number (fastest)
  - **Email Verification**: Get verification email at business email
  - **Document Upload**: Provide business license or utility bill
  - **Postcard Verification**: Receive mailed verification code (5-7 days)
  
  **Step 3: Complete Setup**
  1. Confirm business information
  2. Set up account credentials
  3. Choose subscription plan
  4. Complete portal onboarding
  
  ## Employee Support During Claiming
  
  **Common Client Issues:**
  - **Business Not Found**: Help search with different terms, add manually if needed
  - **Verification Problems**: Check phone/email currency, verify documents
  - **Multiple Locations**: Guide through location-specific verification
  
  **Verification Assistance:**
  - Phone verification is fastest (instant)
  - Email verification requires checking spam folders
  - Document verification needs clear, recent documents
  - Postcard verification takes 5-7 business days
  
  ## Post-Claiming Support
  
  **Help Clients Set Up:**
  1. Complete business profile
  2. Add team members
  3. Configure notifications
  4. Set up review responses
  5. Generate QR codes
  
  **Training Topics:**
  - Dashboard navigation
  - Review management
  - Team permissions
  - Service selection
  
  ## Employee Actions
  
  **When Clients Need Help:**
  - Verify business legitimacy
  - Assist with document verification
  - Troubleshoot technical issues
  - Provide onboarding support
  - Answer questions about services
  
  **Escalation Points:**
  - Complex verification issues
  - Disputed ownership claims
  - Technical verification failures
  - Premium service questions
  
  Business claiming is the first step in client onboarding and sets the foundation for their GladGrade experience.
    `
  },
  {
    id: "sales-management",
    title: "Sales Management System",
    category: "Sales",
    icon: TrendingUp,
    tags: ["sales", "prospects", "pipeline", "commissions", "clients"],
    summary: "Complete guide to managing sales pipeline, prospects, and commissions",
    content: `
# Sales Management System

The Sales Management system helps track prospects, manage client conversions, and monitor commission earnings.

## Sales Pipeline Overview

**Pipeline Stages:**
- Lead: Initial contact or inquiry
- Qualified: Meets criteria for services
- Proposal: Quote or proposal sent
- Negotiation: Discussing terms
- Converted: Became paying client
- Lost: Did not convert

## Prospect Management

**Adding New Prospects:**
1. Click "New Prospect" button
2. Enter business information
3. Set estimated value
4. Assign to salesperson
5. Add initial notes

**Prospect Information:**
- Business name and contact details
- Industry category
- Estimated service value
- Contact history
- Current status
- Assigned salesperson

**Tracking Activities:**
- Calls and meetings
- Email communications
- Proposals sent
- Follow-up reminders
- Status changes

## Conversion Process

**Converting Prospects to Clients:**
1. Select prospect from pipeline
2. Click "Convert to Client"
3. Choose services purchased
4. Set billing information
5. Generate welcome materials

**Conversion Requirements:**
- Complete business information
- Service selection
- Pricing confirmation
- Payment method setup
- Account creation

## Commission Tracking

**Commission Structure:**
- Percentage-based commissions
- Service-specific rates
- Monthly calculations
- Performance bonuses

**Commission Status:**
- Pending: Sale completed, awaiting approval
- Approved: Approved for payment
- Paid: Commission paid out
- Disputed: Under review

**Tracking Your Earnings:**
- View pending commissions
- Track monthly earnings
- Download commission reports
- See payment history

## Performance Analytics

**Sales Metrics:**
- Conversion rates
- Average deal size
- Sales cycle length
- Win/loss ratios

**Individual Performance:**
- Personal targets vs. actual
- Monthly performance trends
- Client satisfaction scores
- Activity metrics

## Team Collaboration

**Sales Team Features:**
- Prospect assignment
- Team performance comparison
- Shared notes and updates
- Lead distribution

**Manager Tools:**
- Team performance dashboards
- Commission management
- Territory assignments
- Performance reviews

## Client Relationship Management

**Post-Conversion Support:**
- Onboarding assistance
- Service implementation
- Ongoing relationship management
- Upselling opportunities

**Client Communication:**
- Automated welcome emails
- QR code delivery
- Account setup assistance
- Training coordination

## Reporting and Analytics

**Available Reports:**
- Sales pipeline reports
- Commission summaries
- Performance analytics
- Client conversion tracking

**Export Options:**
- Excel exports
- PDF reports
- CSV data files
- Email scheduling

## Access Levels

**Sales Representatives:**
- Own prospects and clients
- Personal commission tracking
- Basic reporting

**Sales Managers:**
- Team prospect management
- Commission approval
- Advanced reporting
- Territory management

**Sales Directors:**
- All sales data access
- Strategic planning tools
- Complete analytics
- Team management

The Sales Management system integrates with email automation, QR code generation, and client onboarding to provide a complete sales solution.
    `
  },
  {
    id: "client-management",
    title: "Client Management System",
    category: "Client Services",
    icon: Building,
    tags: ["clients", "accounts", "support", "management", "activities"],
    summary: "Managing business clients, their accounts, and ongoing relationships",
    content: `
# Client Management System

The Client Management system provides comprehensive tools for managing business relationships, account status, and ongoing client support.

## Client Overview

**Client Information Management:**
- Business profiles and details
- Industry categorization
- Service subscriptions
- Account status tracking
- Contact management

**Client Status Types:**
- Active: Currently using services
- Inactive: Temporarily suspended
- Suspended: Account restrictions
- Churned: No longer a client
- Trial: In evaluation period

## Account Management

**Service Management:**
- Current subscriptions
- Service usage tracking
- Billing information
- Upgrade/downgrade processing
- Service renewals

**Billing and Payments:**
- Invoice generation
- Payment tracking
- Credit management
- Refund processing
- Billing disputes

**Contract Management:**
- Service agreements
- Terms and conditions
- Renewal dates
- Amendment tracking
- Contract notifications

## Client Support Activities

**Activity Tracking:**
- Support tickets
- Phone calls
- Email communications
- Meetings and consultations
- Implementation assistance

**Activity Types:**
- Support: Technical assistance
- Training: User education
- Consultation: Strategic advice
- Billing: Financial questions
- Technical: System issues

**Activity Management:**
- Create and assign activities
- Track resolution times
- Monitor client satisfaction
- Schedule follow-ups
- Generate activity reports

## Client Health Monitoring

**Health Score Indicators:**
- Service usage patterns
- Support ticket frequency
- Payment history
- Engagement levels
- Satisfaction surveys

**Risk Management:**
- Churn prediction
- Usage anomalies
- Payment issues
- Support escalations
- Renewal risks

## Multi-Location Clients

**Location Management:**
- Multiple business locations
- Location-specific services
- Individual location performance
- Centralized billing
- Location-based reporting

**Coordination Features:**
- Cross-location insights
- Unified account management
- Location performance comparison
- Service standardization
- Team coordination

## Client Communication

**Communication Tools:**
- Email templates
- Automated notifications
- Personalized messaging
- Bulk communications
- Newsletter management

**Communication Tracking:**
- Message history
- Response rates
- Engagement metrics
- Preference management
- Opt-out handling

## Reporting and Analytics

**Client Analytics:**
- Account performance
- Service utilization
- Support metrics
- Financial analytics
- Growth trends

**Reports Available:**
- Client health reports
- Activity summaries
- Performance dashboards
- Financial reports
- Satisfaction surveys

## Integration Features

**System Integrations:**
- CRM synchronization
- Billing system integration
- Support ticket systems
- Email marketing tools
- Analytics platforms

**Data Management:**
- Client data exports
- Backup procedures
- Data privacy compliance
- Information security
- Access controls

## Access Permissions

**Client Support Roles:**
- Support: Basic client assistance
- Account Manager: Full client management
- Client Success: Strategic relationship management
- Finance: Billing and payment management

**Permission Levels:**
- View: Read-only access to client data
- Edit: Modify client information
- Manage: Full account management
- Admin: System configuration

## Best Practices

**Client Success:**
- Regular check-ins
- Proactive support
- Usage monitoring
- Satisfaction tracking
- Growth opportunity identification

**Data Management:**
- Accurate record keeping
- Regular data updates
- Privacy compliance
- Security maintenance
- Backup verification

The Client Management system ensures comprehensive oversight of business relationships while maintaining high service standards and client satisfaction.
    `
  },
  {
    id: "partners-management",
    title: "Partner Relations Management",
    category: "Partnerships",
    icon: Heart,
    tags: ["partners", "relationships", "integrations", "collaborations"],
    summary: "Managing business partnerships, integrations, and collaborative relationships",
    content: `
# Partner Relations Management

The Partner Relations system manages strategic partnerships, integration partnerships, and collaborative business relationships.

## Partnership Types

**Technology Partners:**
- Software integrations
- API partnerships
- Platform connections
- Data sharing agreements
- Technical collaborations

**Business Partners:**
- Referral partnerships
- Reseller relationships
- Strategic alliances
- Joint ventures
- Channel partnerships

**Service Partners:**
- Implementation partners
- Consulting partners
- Training providers
- Support services
- Specialized expertise

## Partner Management

**Partner Profiles:**
- Company information
- Partnership type and level
- Contact management
- Agreement details
- Performance metrics

**Partnership Lifecycle:**
- Prospecting and evaluation
- Negotiation and agreements
- Implementation and onboarding
- Management and optimization
- Renewal and expansion

## Integration Management

**Technical Integrations:**
- API management
- Data synchronization
- Authentication systems
- Webhook configurations
- Error monitoring

**Integration Types:**
- Review platform integrations
- POS system connections
- Marketing tool integrations
- Analytics platform connections
- Social media integrations

## Performance Tracking

**Partner Metrics:**
- Revenue generation
- Client referrals
- Integration usage
- Support quality
- Market presence

**Performance Reports:**
- Partnership ROI
- Integration analytics
- Referral tracking
- Support metrics
- Growth indicators

## Collaboration Tools

**Communication Management:**
- Partner portals
- Regular check-ins
- Joint planning sessions
- Issue resolution
- Strategic planning

**Resource Sharing:**
- Marketing materials
- Technical documentation
- Training resources
- Best practices
- Case studies

## Contract and Legal

**Agreement Management:**
- Partnership contracts
- Terms and conditions
- SLA agreements
- Revenue sharing
- Termination clauses

**Compliance Tracking:**
- Regulatory requirements
- Data protection standards
- Security compliance
- Industry certifications
- Audit procedures

## Access and Permissions

**Super Admin and Admin Only:**
- Complete partner management
- Contract negotiations
- Strategic planning
- Performance oversight
- Financial arrangements

**Partnership Development:**
- Lead generation
- Relationship building
- Technical coordination
- Implementation support
- Performance monitoring

Partner Relations requires specialized permissions and is typically managed by senior leadership and business development teams.
    `
  },
  {
    id: "content-moderation",
    title: "Content Moderation System",
    category: "Moderation",
    icon: ImageIcon,
    tags: ["moderation", "content", "reviews", "approval", "safety"],
    summary: "Managing content approval, review moderation, and safety standards",
    content: `
# Content Moderation System

The Content Moderation system ensures all user-generated content meets quality and safety standards before publication.

## Moderation Queue

**Content Types:**
- Customer reviews and responses
- Business profile images
- Menu items and descriptions
- User-uploaded photos
- Comments and feedback

**Review Process:**
- Automatic AI screening
- Manual moderator review
- Approval or rejection
- Feedback to submitters
- Appeal process

## Moderation Criteria

**Safety Standards:**
- Inappropriate content removal
- Spam and fake content detection
- Harassment prevention
- Privacy protection
- Legal compliance

**Quality Standards:**
- Accuracy verification
- Professional appearance
- Brand guideline compliance
- Technical quality
- User experience optimization

## Moderation Tools

**Review Interface:**
- Content preview and editing
- Approval/rejection controls
- Comment and feedback tools
- Bulk processing options
- Priority queuing

**AI Assistance:**
- Automated content scanning
- Risk scoring
- Pattern detection
- Duplicate identification
- Quality assessment

## Workflow Management

**Moderation Workflow:**
1. Content submission
2. Automated pre-screening
3. Queue assignment
4. Moderator review
5. Decision and feedback
6. Publication or rejection

**Priority Handling:**
- Urgent content flagging
- VIP client prioritization
- High-risk content alerts
- Time-sensitive approvals
- Emergency procedures

## Performance Metrics

**Moderation Statistics:**
- Processing times
- Approval rates
- Quality scores
- User satisfaction
- Appeal success rates

**Moderator Performance:**
- Review speed
- Accuracy rates
- Consistency scores
- Training completion
- Feedback quality

## Access Levels

**Moderators:**
- Content review and approval
- Basic moderation tools
- Standard workflow access
- Performance tracking

**Senior Moderators:**
- Complex case handling
- Appeal reviews
- Training coordination
- Quality assurance
- Policy development

**Super Admin:**
- Complete system access
- Policy configuration
- Moderator management
- System optimization
- Strategic oversight

Content Moderation maintains platform integrity while ensuring positive user experiences and legal compliance.
    `
  },
  {
    id: "system-admin",
    title: "System Administration",
    category: "Administration",
    icon: Database,
    tags: ["system", "admin", "configuration", "security", "maintenance"],
    summary: "System configuration, security management, and platform maintenance",
    content: `
# System Administration

System Administration provides complete control over platform configuration, security, and operational management.

## System Configuration

**Platform Settings:**
- Global system preferences
- Feature flag management
- Performance optimization
- Capacity management
- Version control

**Security Configuration:**
- Access controls
- Authentication systems
- Encryption settings
- Audit logging
- Compliance monitoring

## User and Access Management

**User Administration:**
- Account creation and management
- Role and permission assignment
- Access level configuration
- Account suspension/activation
- Security credential management

**Permission Framework:**
- Role definitions
- Permission matrices
- Access inheritance
- Custom permission sets
- Temporary access grants

## Database Management

**Database Operations:**
- Schema management
- Data backup and recovery
- Performance monitoring
- Query optimization
- Capacity planning

**Data Integrity:**
- Backup verification
- Data validation
- Consistency checks
- Recovery procedures
- Archive management

## System Monitoring

**Performance Monitoring:**
- System health metrics
- Response time tracking
- Resource utilization
- Error rate monitoring
- Capacity alerts

**Security Monitoring:**
- Access attempt tracking
- Intrusion detection
- Vulnerability scanning
- Compliance auditing
- Incident response

## Integration Management

**API Administration:**
- API key management
- Rate limiting
- Version control
- Documentation updates
- Partner integrations

**Third-Party Services:**
- Service integrations
- Authentication providers
- Payment processors
- Email services
- Analytics platforms

## Maintenance and Updates

**System Maintenance:**
- Scheduled maintenance windows
- Update deployment
- Feature rollouts
- Bug fix implementations
- Performance optimizations

**Documentation:**
- System documentation
- Process procedures
- Emergency protocols
- Training materials
- Best practices

## Access Requirements

**Super Admin Only:**
- Complete system access
- Critical configuration changes
- Security policy management
- Emergency procedures
- Strategic system decisions

System Administration requires the highest level of access and technical expertise to maintain platform security and performance.
    `
  },
  {
    id: "user-management",
    title: "User Management System",
    category: "Administration",
    icon: ShieldCheck,
    tags: ["users", "permissions", "roles", "security", "access"],
    summary: "Managing user accounts, roles, permissions, and access controls",
    content: `
# User Management System

The User Management system provides comprehensive control over user accounts, roles, permissions, and access throughout the platform.

## User Account Management

**Account Creation:**
- Manual user creation
- Bulk user imports
- Self-registration controls
- Account verification
- Welcome workflows

**Account Maintenance:**
- Profile management
- Status changes
- Password resets
- Account recovery
- Data updates

## Role and Permission System

**Standard Roles:**
- Super Admin: Complete system access
- Admin: Administrative functions
- Employee: Department-specific access
- Moderator: Content moderation
- Client: Business account access

**Permission Categories:**
- System Administration
- User Management
- Client Management
- Content Moderation
- Sales Pipeline
- Financial Access
- Reporting Access

## Department-Based Access

**Department Permissions:**
- Sales: Client pipeline and prospect management
- Support: Client assistance and ticketing
- Marketing: Campaign and content management
- Finance: Billing and commission management
- IT: System and technical administration

**Custom Permissions:**
- Granular access controls
- Feature-specific permissions
- Time-limited access
- Location-based restrictions
- Data access controls

## Security Management

**Authentication Controls:**
- Password policies
- Two-factor authentication
- Session management
- Login attempt monitoring
- Account lockout procedures

**Access Monitoring:**
- User activity tracking
- Permission usage logs
- Security event monitoring
- Anomaly detection
- Compliance reporting

## User Onboarding

**New User Process:**
1. Account creation
2. Role assignment
3. Permission configuration
4. Welcome communication
5. Training coordination

**Training and Support:**
- Role-specific training
- Permission explanations
- System orientation
- Documentation access
- Support contacts

## Audit and Compliance

**User Auditing:**
- Access logs
- Permission changes
- Activity tracking
- Compliance reporting
- Security reviews

**Data Management:**
- User data protection
- Privacy compliance
- Data retention policies
- Export capabilities
- Deletion procedures

## Access Levels

**Super Admin:**
- Complete user management
- System-wide access controls
- Security policy management
- Emergency access procedures

**Admin:**
- User account management
- Role assignments
- Department coordination
- Basic security oversight

User Management ensures secure, organized access to platform features while maintaining proper oversight and compliance.
    `
  },
  {
    id: "employee-reviews",
    title: "Employee Review Management",
    category: "Reviews",
    icon: MessageSquare,
    tags: ["reviews", "moderation", "client", "management", "analytics"],
    summary: "Employee tools for managing client reviews and content moderation",
    content: `
# Employee Review Management

Employee Review Management provides tools for GladGrade staff to assist clients with review management and content oversight.

## Client Review Support

**Supporting Client Needs:**
- Review response assistance
- Content moderation support
- Analytics interpretation
- Best practice guidance
- Technical troubleshooting

**Review Analysis:**
- Cross-client trend analysis
- Industry benchmarking
- Performance comparisons
- Improvement recommendations
- Strategic insights

## Content Oversight

**Review Moderation:**
- Inappropriate content flagging
- Spam detection and removal
- Fake review identification
- Content quality assessment
- Platform compliance

**Moderation Actions:**
- Content approval/rejection
- Review flagging
- Response recommendations
- Escalation procedures
- Policy enforcement

## Client Assistance

**Support Functions:**
- Review response guidance
- Template creation assistance
- Performance optimization
- Training and education
- Technical support

**Analytics Support:**
- Data interpretation
- Report generation
- Trend identification
- Performance insights
- Recommendation development

## Quality Assurance

**Review Quality:**
- Content authenticity verification
- Response quality assessment
- Platform guideline compliance
- Brand standard maintenance
- User experience optimization

**Performance Monitoring:**
- Client satisfaction tracking
- Response time monitoring
- Resolution rate tracking
- Quality score maintenance
- Improvement identification

## Cross-Client Insights

**Industry Analysis:**
- Sector performance trends
- Competitive insights
- Best practice identification
- Market analysis
- Growth opportunities

**Platform Optimization:**
- Feature usage analysis
- Performance optimization
- User experience improvements
- System enhancements
- Strategic development

## Access Based on Role

**Content Moderators:**
- Review content approval
- Quality assessment
- Policy enforcement
- User guidance

**Client Support:**
- Client assistance
- Technical support
- Performance guidance
- Training delivery

**Admins and Super Admins:**
- Complete review oversight
- Policy development
- System configuration
- Strategic planning

Employee Review Management ensures high-quality content and excellent client support while maintaining platform standards.
    `
  },
  {
    id: "employee-services",
    title: "Employee Services Management",
    category: "Services",
    icon: ConciergeBell,
    tags: ["services", "internal", "client", "support", "configuration"],
    summary: "Internal service management, client support, and service configuration",
    content: `
# Employee Services Management

Employee Services Management provides internal tools for managing client services, configurations, and support operations.

## Service Administration

**Service Configuration:**
- Service package management
- Pricing administration
- Feature flag controls
- Access level management
- Integration configuration

**Client Service Setup:**
- Account provisioning
- Service activation
- Configuration assistance
- Integration implementation
- Testing and validation

## Client Support Operations

**Service Support:**
- Technical assistance
- Configuration help
- Troubleshooting
- Feature guidance
- Best practice consultation

**Implementation Services:**
- Onboarding coordination
- Setup assistance
- Training delivery
- Go-live support
- Performance optimization

## Service Analytics

**Usage Monitoring:**
- Service utilization tracking
- Performance metrics
- Client satisfaction scores
- Support ticket analysis
- Feature adoption rates

**Performance Analysis:**
- Service reliability metrics
- Response time monitoring
- Error rate tracking
- Capacity utilization
- Optimization opportunities

## Internal Service Tools

**Employee Resources:**
- Service documentation
- Configuration guides
- Troubleshooting procedures
- Best practice resources
- Training materials

**Collaboration Tools:**
- Cross-team communication
- Service request tracking
- Knowledge sharing
- Issue escalation
- Project coordination

## Service Development

**Feature Management:**
- Service enhancement planning
- Feature rollout coordination
- Testing procedures
- Quality assurance
- Release management

**Client Feedback Integration:**
- Feature request tracking
- Client satisfaction analysis
- Improvement prioritization
- Development coordination
- Release communication

## Access and Permissions

**Service Administrators:**
- Complete service configuration
- Client account management
- Performance oversight
- Strategic planning

**Support Staff:**
- Client assistance
- Basic configuration
- Issue resolution
- Documentation access

**Technical Staff:**
- Integration management
- System configuration
- Performance optimization
- Development support

Employee Services Management ensures efficient service delivery and excellent client experiences while maintaining system integrity and performance.
    `
  },
  {
    id: "employee-profile",
    title: "Employee Profile Management",
    category: "Account",
    icon: User,
    tags: ["profile", "employee", "permissions", "settings", "account"],
    summary: "Managing employee profiles, permissions, and account settings",
    content: `
# Employee Profile Management

Employee Profile Management provides tools for managing personal account information, permissions, and work-related settings.

## Personal Profile

**Account Information:**
- Personal details and contact information
- Job title and department
- Employee ID and hire date
- Manager and team assignments
- Profile photo and preferences

**Work Information:**
- Department and role assignments
- Permission levels
- Access credentials
- Work schedule
- Contact preferences

## Permission Management

**Role-Based Access:**
- Department-specific permissions
- Feature access controls
- Client access levels
- System administration rights
- Temporary access grants

**Permission Tracking:**
- Current permission sets
- Permission history
- Access audit logs
- Change notifications
- Compliance tracking

## Security Settings

**Account Security:**
- Password management
- Two-factor authentication
- Session controls
- Device management
- Security notifications

**Access Controls:**
- IP restrictions
- Time-based access
- Feature limitations
- Data access controls
- Emergency access procedures

## Performance Tracking

**Work Metrics:**
- Task completion rates
- Response times
- Client satisfaction scores
- Goal achievement
- Performance trends

**Professional Development:**
- Training completion
- Skill assessments
- Certification tracking
- Goal setting
- Career development

## Team Integration

**Collaboration Settings:**
- Team assignments
- Communication preferences
- Availability status
- Project assignments
- Responsibility areas

**Manager Access:**
- Performance reviews
- Goal setting
- Training assignments
- Permission requests
- Career development

## Notification Preferences

**Work Notifications:**
- Task assignments
- Client updates
- System alerts
- Team communications
- Performance feedback

**Personal Preferences:**
- Communication methods
- Notification timing
- Priority settings
- Quiet hours
- Device preferences

## Data and Privacy

**Personal Data:**
- Data privacy settings
- Information sharing controls
- Export capabilities
- Retention preferences
- Deletion procedures

**Work Data:**
- Access to work-related data
- Performance information
- Training records
- Achievement tracking
- Goal monitoring

Employee Profile Management ensures proper access control and professional development while maintaining security and compliance standards.
    `
  }
]

export default function HelpSupportPage() {
  // const { role, clientRole } = useAuth() // Replace with actual auth provider
  const { role, clientRole, user } = useAuth()  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // Support request modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [supportSubject, setSupportSubject] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [sendingSupport, setSendingSupport] = useState(false)

  const isClient = role === "client"
  
  // Select appropriate articles based on user type
  const articles = isClient ? CLIENT_ARTICLES : EMPLOYEE_ARTICLES

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ["all", ...new Set(articles.map(article => article.category))]
    return cats
  }, [articles])

  
  // Support request handler
    // Add the useAuth import at the top of your file, replace the mock auth
// import { useAuth } from "@/app/providers" // Uncomment this line
// const { role, clientRole, user } = useAuth() // Replace mockAuth with this

// Support request handler
const handleSupportRequest = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      alert("Please fill in both subject and message")
      return
    }
  
    setSendingSupport(true)
    
    try {
      // Get Firebase ID token from the authenticated user
      if (!user) {
        throw new Error("User not authenticated")
      }
  
      const token = await user.getIdToken()
  
      const response = await fetch('/api/portal/clients/send-support-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: supportSubject,
          message: supportMessage
        })
      })
  
      const result = await response.json()
  
      if (result.success) {
        // Reset form and close modal
        setSupportSubject("")
        setSupportMessage("")
        setSupportModalOpen(false)
        alert("Support request sent successfully! We'll get back to you soon.")
      } else {
        throw new Error(result.error || 'Failed to send support request')
      }
      
    } catch (error) {
      console.error("Error sending support request:", error)
      alert(`Failed to send support request: ${error}`)
    } finally {
      setSendingSupport(false)
    }
  }

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    let filtered = articles

    if (selectedCategory !== "all") {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(article => 
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query)) ||
          article.content.toLowerCase().includes(query)
        )
      }

    return filtered
  }, [articles, searchQuery, selectedCategory])

  // Search result highlighting
  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</span> : 
        part
    )
  }

  if (selectedArticle) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedArticle(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help Center
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <selectedArticle.icon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">{selectedArticle.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{selectedArticle.category}</Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{selectedArticle.summary}</span>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="prose dark:prose-invert max-w-none p-6">
            <div dangerouslySetInnerHTML={{ 
              __html: selectedArticle.content
                .replace(/\n/g, '<br>')
                .replace(/## (.*?)(<br>|$)/g, '<h2 class="text-xl font-semibold mt-6 mb-3 text-foreground">$1</h2>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                .replace(/- (.*?)(<br>|$)/g, '<li class="ml-4 mb-1">$1</li>')
                .replace(/🚧 \*\*(.*?)\*\*/g, '<div class="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4"><strong class="text-yellow-700 dark:text-yellow-300">🚧 $1</strong>')
                .replace(/✅ (.*?)(<br>|$)/g, '<div class="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2"><CheckCircle class="h-4 w-4" />$1</div>')
            }} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isClient ? "Client" : "Employee"} Help & Support
            </h1>
            <p className="text-muted-foreground">
              {isClient 
                ? "Everything you need to know about using your GladGrade portal" 
                : "Internal documentation and guides for GladGrade employees"
              }
            </p>
          </div>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {isClient ? `Client ${clientRole?.replace('client_', '').replace('_', ' ') || ''}` : role}
          </Badge>
          {!isClient && (
            <Badge variant="secondary" className="text-sm">
              Employee Documentation
            </Badge>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help articles, features, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === "all" ? "All Topics" : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="mb-4 text-sm text-muted-foreground">
          Found {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((article) => {
          const IconComponent = article.icon
          return (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">
                      {highlightSearchTerm(article.title, searchQuery)}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {highlightSearchTerm(article.summary, searchQuery)}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Results */}
      {filteredArticles.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or browse all categories
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
        <Card className="mt-8 bg-muted/50">
        <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Need Additional Help?</h3>
            <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Dialog open={supportModalOpen} onOpenChange={setSupportModalOpen}>
                <DialogTrigger asChild>
                <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Contact Support
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Contact Support
                    </DialogTitle>
                    <DialogDescription>
                    Send us a message and we'll get back to you as soon as possible.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        disabled={sendingSupport}
                    />
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                        id="message"
                        placeholder="Please describe your issue in detail..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        rows={6}
                        disabled={sendingSupport}
                    />
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                    variant="outline" 
                    onClick={() => setSupportModalOpen(false)}
                    disabled={sendingSupport}
                    >
                    Cancel
                    </Button>
                    <Button 
                    onClick={handleSupportRequest}
                    disabled={sendingSupport || !supportSubject.trim() || !supportMessage.trim()}
                    >
                    {sendingSupport ? (
                        <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                        </>
                    ) : (
                        "Send Request"
                    )}
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button variant="outline" disabled className="opacity-50">
                <Book className="h-4 w-4 mr-2" />
                Video Tutorials
                <span className="ml-2 text-xs">(Coming Soon)</span>
            </Button>
            </div>
        </CardContent>
        </Card>
    </div>
  )
}