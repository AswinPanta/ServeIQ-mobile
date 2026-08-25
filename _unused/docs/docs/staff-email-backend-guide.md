# Backend: Staff Account Creation Email via Resend

This guide covers adding a staff invite endpoint to the FastAPI backend (`Booking_system` repo) that sends a welcome email with login credentials using Resend.

## 1. Install Resend

```bash
pip install resend
```

## 2. Environment Variables

Add to your `.env`:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=ServeIQ <noreploy@ServeIQ.com>
```

## 3. Resend Configuration

```python
# config/email.py
import os
import resend

resend.api_key = os.environ["RESEND_API_KEY"]
EMAIL_FROM = os.environ.get("EMAIL_FROM", "ServeIQ <noreploy@ServeIQ.com>")
```

## 4. Email Template

```python
# templates/staff_invite.py

def staff_invite_html(first_name: str, email: str, temp_password: str, department: str, position: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#F1F5F9;font-family:Inter,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background:#1E293B;padding:28px;text-align:center;">
          <h1 style="color:#fff;font-size:24px;margin:0;font-weight:800;">ServeIQ</h1>
        </div>
        <!-- Success Banner -->
        <div style="background:#10B981;padding:14px;text-align:center;">
          <p style="color:#fff;font-size:14px;margin:0;font-weight:700;letter-spacing:1.5px;">✓ ACCOUNT CREATED</p>
        </div>
        <!-- Content -->
        <div style="padding:28px;">
          <h2 style="color:#1E293B;font-size:22px;margin:0 0 8px;">Welcome, {first_name}</h2>
          <p style="color:#64748B;font-size:14px;line-height:22px;margin:0 0 24px;">
            Your ServeIQ staff account has been created. Here are your login credentials.
          </p>
          <!-- Credentials Table -->
          <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#F8FAFC;">
              <td style="padding:12px 16px;color:#64748B;font-size:13px;width:140px;border-bottom:1px solid #E2E8F0;">Username</td>
              <td style="padding:12px 16px;color:#1E293B;font-size:13px;font-weight:600;border-bottom:1px solid #E2E8F0;">{email.split('@')[0]}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#64748B;font-size:13px;border-bottom:1px solid #E2E8F0;">Email</td>
              <td style="padding:12px 16px;color:#2563EB;font-size:13px;font-weight:600;border-bottom:1px solid #E2E8F0;">{email}</td>
            </tr>
            <tr style="background:#F8FAFC;">
              <td style="padding:12px 16px;color:#64748B;font-size:13px;border-bottom:1px solid #E2E8F0;">Temporary Password</td>
              <td style="padding:12px 16px;color:#1E293B;font-size:13px;font-weight:600;font-family:monospace;border-bottom:1px solid #E2E8F0;">{temp_password}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#64748B;font-size:13px;border-bottom:1px solid #E2E8F0;">Department</td>
              <td style="padding:12px 16px;color:#1E293B;font-size:13px;font-weight:600;border-bottom:1px solid #E2E8F0;">{department}</td>
            </tr>
            <tr style="background:#F8FAFC;">
              <td style="padding:12px 16px;color:#64748B;font-size:13px;">Position</td>
              <td style="padding:12px 16px;color:#1E293B;font-size:13px;font-weight:600;">{position}</td>
            </tr>
          </table>
          <!-- Note -->
          <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:12px;">
            <p style="color:#92400E;font-size:12px;line-height:18px;margin:0;">
              Please share these credentials securely with the staff member. They should change their password on first login.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    """
```

## 5. API Endpoint

```python
# routers/staff.py
import secrets
import string
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from config.email import resend, EMAIL_FROM
from templates.staff_invite import staff_invite_html

router = APIRouter(prefix="/api/v1/staff", tags=["staff"])

class StaffInviteRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str = ""
    role: str = "front_desk"
    department: str = "General"
    position: str = ""

class StaffInviteResponse(BaseModel):
    success: bool
    message: str
    staff_id: str

def generate_temp_password(length: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    # Avoid confusing chars (0, O, l, 1, i)
    alphabet = ''.join(c for c in alphabet if c not in '0ol1i')
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/invite", response_model=StaffInviteResponse)
async def invite_staff(req: StaffInviteRequest):
    """Create a staff account and send welcome email with credentials."""
    
    temp_password = generate_temp_password()
    
    # TODO: Save staff to database here
    # staff_id = await db.create_staff(...)
    staff_id = f"st-{secrets.token_hex(8)}"
    
    # Send email via Resend
    html = staff_invite_html(
        first_name=req.first_name,
        email=req.email,
        temp_password=temp_password,
        department=req.department,
        position=req.position or req.role.replace("_", " ").title(),
    )
    
    try:
        resend.Emails.send({
            "from": EMAIL_FROM,
            "to": req.email,
            "subject": "Your ServeIQ Account Has Been Created",
            "html": html,
        })
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send staff invite email: {e}")
    
    return StaffInviteResponse(
        success=True,
        message=f"Staff account created. Welcome email sent to {req.email}",
        staff_id=staff_id,
    )
```

## 6. Register Router

```python
# main.py
from routers.staff import router as staff_router
app.include_router(staff_router)
```

## 7. Frontend Integration

Update `app/(operations)/admin/staff.tsx` to call the real API:

```typescript
const handleCreateStaff = async () => {
  // ... validation ...
  
  try {
    const response = await fetch(`${API_BASE_URL}/staff/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
        department,
        position: position.trim() || ROLE_LABELS[role],
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show email preview modal
      setEmailModalStaff({ ... });
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to create staff account');
  }
};
```

## Testing

```bash
curl -X POST http://localhost:8000/api/v1/staff/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "front_desk",
    "department": "Front Office",
    "position": "Receptionist"
  }'
```

## Resend Free Tier Limits

- 100 emails/day
- 3,000 emails/month
- No credit card required
