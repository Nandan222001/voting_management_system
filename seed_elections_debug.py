from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost:3306/voting_db')
with engine.connect() as conn:
    conn.execute(text("""
        INSERT INTO elections (
            tenant_id, 
            title, 
            description, 
            start_date, 
            end_date, 
            status, 
            created_at, 
            updated_at
        ) VALUES 
        (1, 'City Council Election 2026', 'Election for the municipal city council members.', '2026-05-30 09:00:00', '2026-07-15 18:00:00', 'active', NOW(), NOW()),
        (1, 'Delegate Referendum', 'Public vote on the new constitutional delegate proposal.', '2026-06-01 08:00:00', '2026-06-30 20:00:00', 'active', NOW(), NOW()),
        (1, 'Regional Transport Board Vote', 'Selection of representatives for the regional transport authority.', '2026-05-15 10:00:00', '2026-07-01 17:00:00', 'active', NOW(), NOW()),
        (1, 'Community Health Initiative', 'Voting on the prioritization of community health projects.', '2026-06-03 12:00:00', '2026-08-10 12:00:00', 'active', NOW(), NOW()),
        (1, 'Education Policy Ballot', 'Decision on the updated district education guidelines.', '2026-05-25 09:30:00', '2026-06-25 18:30:00', 'active', NOW(), NOW());
    """))
    conn.commit()
print("Success")
