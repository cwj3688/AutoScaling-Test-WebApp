# Autoscaling Web App

이 프로젝트는 Node.js와 Express로 구축된 간단한 웹 애플리케이션입니다. 현재 요청을 처리하는 서버의 호스트 이름을 표시하며, 선택적으로 PostgreSQL 데이터베이스에 연결하여 접속 로그를 기록하고 표시하는 기능을 가지고 있습니다.

또한, CPU 부하를 테스트하기 위한 `/load` 엔드포인트를 제공합니다.

## 주요 기능

- Express를 사용한 웹 서버
- EJS 템플릿 엔진을 사용한 동적 HTML 렌더링
- PostgreSQL 데이터베이스 연동 (선택 사항)
- 접속 로그 기록 및 조회
- CPU 부하 테스트 엔드포인트

## 사전 요구사항

- [Node.js](https://nodejs.org/) (14.x 버전 이상 권장)
- [PostgreSQL](https://www.postgresql.org/) 데이터베이스 (선택 사항)

## 설치 방법

1.  **프로젝트 클론 또는 다운로드**

    ```bash
    git clone <repository-url>
    cd scp-autoscaling-webapp
    ```

2.  **NPM 패키지 설치**

    프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 필요한 패키지를 설치합니다.

    ```bash
    npm install
    ```

## 설정

### 데이터베이스 (선택 사항)

이 애플리케이션은 접속 로그를 기록하기 위해 PostgreSQL 데이터베이스를 사용할 수 있습니다. 데이터베이스 연결은 기본적으로 비활성화되어 있습니다.

데이터베이스 기능을 사용하려면 다음 단계를 따르세요.

1.  **`db-config.js` 파일 수정**

    프로젝트 루트에 있는 `db-config.js` 파일을 열고 다음과 같이 수정합니다.

    -   `enabled` 값을 `true`로 변경합니다.
    -   `user`, `host`, `database`, `password`, `port` 값을 자신의 PostgreSQL 환경에 맞게 수정합니다.

    ```javascript
    // db-config.js

    const dbConfig = {
      enabled: true, // 이 값을 true로 변경
      user: 'your_postgres_user',     // PostgreSQL 사용자 이름
      host: 'localhost',              // 데이터베이스 서버 호스트
      database: 'your_database_name', // 사용할 데이터베이스 이름
      password: 'your_password',      // 사용자 비밀번호
      port: 5432,                     // 포트 번호
    };

    module.exports = dbConfig;
    ```

2.  **테이블 자동 생성**

    서버가 성공적으로 데이터베이스에 연결되면 `access_logs` 테이블이 자동으로 생성됩니다.

## 실행 방법

1.  **서버 시작**

    다음 명령어를 사용하여 웹 서버를 시작합니다.

    ```bash
    node server.js
    ```

2.  **서버 접속**

    웹 브라우저를 열고 다음 주소로 접속합니다.

    -   **메인 페이지**: `http://localhost:3000`
    -   **CPU 부하 테스트**: `http://localhost:3000/load`

서버가 시작되면 콘솔에 실행 상태와 데이터베이스 연결 상태가 표시됩니다.
