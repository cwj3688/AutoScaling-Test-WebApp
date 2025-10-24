// db-config.js

// process.env를 사용하면 환경 변수에서 설정을 가져올 수 있습니다.
// 여기서는 간단하게 직접 값을 할당합니다.
const dbConfig = {
  enabled: true, // DB 사용 여부
  host: 'localhost',
  port: 3306,
  user: 'root', // MariaDB 사용자 이름
  password: 'yourpassword', // MariaDB 비밀번호
  database: 'testdb', // 사용할 데이터베이스 이름
  connectionLimit: 5 // 동시에 연결할 수 있는 최대 연결 수
};

module.exports = dbConfig;
