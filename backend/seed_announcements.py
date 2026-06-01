import enum
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.announcement import Announcement, AnnouncementStatus
from app.models.tenant import Tenant
from app.models.user import User

from sqlalchemy import text

def seed_announcements():
    db = SessionLocal()
    try:
        print("Truncating 'announcements' table...")
        db.execute(text("DELETE FROM announcements"))
        db.commit()
        print("Table truncated.")

        # Get first available tenant
        tenant = db.query(Tenant).first()
        if not tenant:
            print("No tenants found. Please seed tenants first.")
            return

        # Get first available superadmin or admin
        user = db.query(User).first()
        if not user:
            print("No users found. Please seed users first.")
            return

        print(f"Seeding announcements for tenant: {tenant.name} (ID: {tenant.id})")
        print(f"Created by user: {user.email} (ID: {user.id})")

        announcements_data = [
            {
                "title": "Upcoming General Election 2026",
                "short_description": "Prepare for the upcoming general election. Register to vote now!",
                "content": "The 2026 General Election is approaching. All citizens are encouraged to register and participate in the democratic process. Your vote is your voice!",
                "is_featured": True,
                "image_urls": ["https://images.unsplash.com/photo-1540910419892-f0c97a214066?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "New Political Party Registered: Green Future",
                "short_description": "A new party focusing on environmental sustainability has been officially registered.",
                "content": "The 'Green Future' party has completed its registration process. They aim to bring environmental issues to the forefront of the political agenda.",
                "is_featured": False,
                "image_urls": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "Voter Registration Deadline Extension",
                "short_description": "Good news! The deadline for voter registration has been extended by two weeks.",
                "content": "To ensure maximum participation, the electoral commission has decided to extend the registration deadline. Please visit your local center.",
                "is_featured": False,
                "image_urls": ["https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "Debate Tonight: Economic Policies",
                "short_description": "Join us for a live debate between party leaders on economic strategies.",
                "content": "Tonight at 8 PM, leaders from all major parties will discuss their plans for the economy. Watch live on our platform.",
                "is_featured": True,
                "image_urls": ["https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "How to Use the New Digital Voting System",
                "short_description": "A step-by-step guide to our new secure online voting portal.",
                "content": "We have launched a new digital voting system. This guide explains how to log in, verify your identity, and cast your vote safely.",
                "is_featured": False,
                "image_urls": ["https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "Youth Wing Participation Reaches Record High",
                "short_description": "More young people are joining political parties than ever before.",
                "content": "Recent statistics show a significant increase in youth engagement with political parties. This is a positive sign for the future of our democracy.",
                "is_featured": False,
                "image_urls": ["https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "Integrity of the Voting Process",
                "short_description": "Learn about the security measures we take to protect your vote.",
                "content": "Security is our top priority. We use end-to-end encryption and blockchain technology to ensure that every vote is counted correctly and cannot be tampered with.",
                "is_featured": True,
                "image_urls": ["https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "Party Manifesto: The Progressive Alliance",
                "short_description": "The Progressive Alliance has released its manifesto for the next five years.",
                "content": "Focusing on healthcare, education, and social justice, the Progressive Alliance outlines its vision for a fairer society.",
                "is_featured": False,
                "image_urls": ["https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "Election Day Volunteers Needed",
                "short_description": "Be a part of history. Sign up to help at your local polling station.",
                "content": "We are looking for enthusiastic volunteers to assist voters on election day. Training will be provided.",
                "is_featured": False,
                "image_urls": ["https://images.unsplash.com/photo-1559027615-cd2673b15342?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "title": "Closing Ceremony: Election 2026 Results",
                "short_description": "Join us for the official announcement of the election results.",
                "content": "The wait is almost over. Join us live as we announce the final results and hear from the winning candidates.",
                "is_featured": True,
                "image_urls": ["https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800"]
            }
        ]

        for i, data in enumerate(announcements_data):
            announcement = Announcement(
                tenant_id=tenant.id,
                created_by=user.id,
                title=data["title"],
                short_description=data["short_description"],
                content=data["content"],
                image_urls=data.get("image_urls", []),
                attachment_urls=[],
                publish_date=datetime.utcnow() - timedelta(days=i),
                status=AnnouncementStatus.published,
                is_featured=data["is_featured"]
            )
            db.add(announcement)
        
        db.commit()
        print(f"Successfully added {len(announcements_data)} announcements.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_announcements()
