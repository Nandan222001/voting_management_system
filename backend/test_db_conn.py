import pymysql

def test_conn(user, password, host='localhost', port=3306, db='voting_db'):
    print(f"Testing {user}:{password}@{host}:{port}/{db}...")
    try:
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=db,
            port=port
        )
        print("SUCCESS!")
        conn.close()
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

if __name__ == "__main__":
    test_conn('root', '')
    test_conn('root', 'password')
    test_conn('root', 'root')
    test_conn('admin', 'admin')
