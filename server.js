const express = require('express');
const mariadb = require('mariadb');
const os = require('os');
const fs = require('fs');

const app = express();
const port = 3000;

// POST 요청 본문을 파싱하기 위한 미들웨어
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const hostname = os.hostname();

let pool;
let dbConnected = false;

// --- 부하 상태 관리를 위한 로컬 변수 ---
let isLoadActive = false;
let loadInterval = null;

// --- 서버 시작 로직 ---
async function startServer() {
  const dbConfig = fs.existsSync('./db-config.js') ? require('./db-config') : null;

  if (dbConfig && dbConfig.enabled) {
    try {
      pool = mariadb.createPool(dbConfig);
      const conn = await pool.getConnection();
      await conn.query('SELECT 1');
      conn.release();
      
      dbConnected = true;
      console.log('데이터베이스에 성공적으로 연결되었습니다.');
      
      // 테이블 초기화
      await initializeAccessLogTable();
      await initializeLoadStatusTable();

    } catch (err) {
      console.warn('경고: DB 연결에 실패했습니다. 데이터베이스 기능 없이 애플리케이션을 시작합니다.');
      console.warn(`   > 원인: ${err.message}`);
    }
  } else {
    console.info('정보: DB 설정이 비활성화되어 있거나 설정 파일이 없어 DB 기능 없이 실행됩니다.');
  }

  // --- 라우팅 ---
  app.get('/', async (req, res) => {
    let logs = [];
    if (dbConnected) {
      let conn;
      try {
        conn = await pool.getConnection();
        await conn.query('INSERT INTO access_logs (hostname) VALUES (?)', [hostname]);
        logs = await conn.query('SELECT * FROM access_logs ORDER BY access_time DESC');
      } catch (err) {
        console.error('데이터베이스 작업 중 오류 발생:', err);
      } finally {
        if (conn) conn.release();
      }
    }
    res.render('index', {
      hostname: hostname,
      logs: logs,
      dbConnected: dbConnected
    });
  });

  // --- 부하 제어 페이지 ---
  app.get('/load-control', async (req, res) => {
    let loadStatus = [];
    if (dbConnected) {
      let conn;
      try {
        conn = await pool.getConnection();
        loadStatus = await conn.query('SELECT * FROM load_status ORDER BY updated_at DESC');
      } catch (err) {
        console.error('부하 상태 조회 중 오류 발생:', err);
      } finally {
        if (conn) conn.release();
      }
    }
    res.render('load-control', {
      hostname: hostname,
      dbConnected: dbConnected,
      loadStatus: loadStatus
    });
  });

  // --- 부하 시작 ---
  app.post('/load', async (req, res) => {
    if (isLoadActive) {
      console.log(`[${hostname}] 이미 부하 작업이 실행 중이므로 요청을 건너뜁니다.`);
    } else {
      console.log(`[${hostname}] '/load' 요청 수신. CPU 부하 작업을 시작합니다.`);
      isLoadActive = true;
      loadInterval = setInterval(intensiveTask, 0);

      if (dbConnected) {
        let conn;
        try {
          conn = await pool.getConnection();
          await conn.query(
            'INSERT INTO load_status (hostname, status, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE status = ?, updated_at = NOW()',
            [hostname, 'RUNNING', 'RUNNING']
          );
          console.log(`[${hostname}] DB에 부하 상태 'RUNNING'으로 기록했습니다.`);
        } catch (err) {
          console.error('부하 상태 DB 기록 중 오류:', err);
        } finally {
          if (conn) conn.release();
        }
      }
    }
    res.redirect('/load-control');
  });

  // --- 부하 중지 ---
  app.post('/stop', async (req, res) => {
    if (!isLoadActive) {
      console.log(`[${hostname}] 부하 작업이 실행 중이 아니므로 요청을 건너뜁니다.`);
    } else {
      console.log(`[${hostname}] '/stop' 요청 수신. CPU 부하 작업을 중지합니다.`);
      isLoadActive = false;
      clearInterval(loadInterval);
      loadInterval = null;

      if (dbConnected) {
        let conn;
        try {
          conn = await pool.getConnection();
          await conn.query(
            'UPDATE load_status SET status = ?, updated_at = NOW() WHERE hostname = ?',
            ['STOPPED', hostname]
          );
          console.log(`[${hostname}] DB에 부하 상태 'STOPPED'으로 기록했습니다.`);
        } catch (err) {
          console.error('부하 상태 DB 기록 중 오류:', err);
        } finally {
          if (conn) conn.release();
        }
      }
    }
    res.redirect('/load-control');
  });


  // --- 서버 리스닝 시작 ---
  app.listen(port, () => {
    console.log(`
🚀 웹 서버가 http://localhost:${port} 에서 실행 중입니다.`);
    if (dbConnected) {
      console.log('   > DB 상태: [연결됨] 모든 기능이 활성화되었습니다.');
    } else {
      console.log('   > DB 상태: [연결 안 됨] DB 관련 기능이 비활성화되었습니다.');
    }
  });
}

// --- DB 테이블 초기화 함수들 ---
async function initializeAccessLogTable() {
  if (!dbConnected) return;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hostname VARCHAR(255) NOT NULL,
        access_time TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   > "access_logs" 테이블이 준비되었습니다.');
  } catch (err) {
    console.error('"access_logs" 테이블 생성 오류:', err);
  } finally {
    if (conn) conn.release();
  }
}

async function initializeLoadStatusTable() {
  if (!dbConnected) return;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS load_status (
        hostname VARCHAR(255) PRIMARY KEY,
        status VARCHAR(20) NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    console.log('   > "load_status" 테이블이 준비되었습니다.');
  } catch (err) {
    console.error('"load_status" 테이블 생성 오류:', err);
  } finally {
    if (conn) conn.release();
  }
}

// --- CPU 부하 발생 함수 ---
function intensiveTask() {
    const end = Date.now() + 200; // 200ms 동안 집중적으로 실행
    while (Date.now() < end) {
        for (let i = 0; i < 200000; i++) {
            Math.sqrt(i);
        }
    }
}

// --- 서버 시작 ---
startServer();