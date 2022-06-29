// mysql_promise
// npm install mysql2

let mysql = require("mysql2/promise");

const pool = mysql.createPool({
    connectionLimit:10,
    host: "127.0.0.1",
    user: "root",
    password: "20170520",
    database: "mydb",
    port: 3306
});

// 트랜잭션처리 - 두개 이상의 쿼리가 하나의 결과를 위해 협력해야 할 때
// 예를들어 우리은행 -> 하나은행으로 송금
// 우리은행 db에서 돈이 빠져나간 정보가 저장되어야 한다.
// 하나은행 db에 이체된 돈에 대한 정보가 저장되어야 한다.
// 트랜잭션은 어느 하나가 취소되면 나머지도 모두 원상복구되는 쿼리들의 묶음

/* 
create table tb_file(
    id bigint not null primary key auto_increment,
    board_id bigint,
    filename varchar(256),
    wdate datetime
);
*/

// async - 함수 앞에 붙이면, 리턴값을 무조건 promise 객체로 보낸다.
// await는 promise가 끝날때까지 기다린다.
// 함수 앞에 async가 있어야 await를 사용가능하다. 함수 안에서만 사용 가능하다.
async function saveDB(title, contents, writer, filename){
    // await를 이용해서 사실 비동기지만 동기식으로 동작하는 것처럼 코딩을 한다.
    const connection = await pool.getConnection(async conn => conn);
    // 연결이 끝나야 이 다음 문장으로 넘어온다.

    try {
        await connection.beginTransaction(); // 트랜잭션(프라미스 객체)
        let sql = `insert into board(title, contents, writer, wdate, hit) values('${title}', '${contents}','${writer}', now(), 0)`;
        //console.log(sql);
        let params = [title, contents, writer];
        await connection.query(sql); // 쿼리가 실행이 완료할 때까지 대기한다.
        //console.log("확인2");
        // 마지막으로 추가된 데이터의 ID값을 알아와야 한다.
        sql = "select last_insert_id() as boardId";
        const [rows] = await connection.query(sql);
        let id = rows[0]["boardId"];
        //console.log(id);
        sql = `insert into tb_file(board_id, filename, wdate) values('${id}', '${filename}', now())`;
        //console.log(sql);
        await connection.query(sql);
        //console.log("확인3");
        await connection.commit(); // 트랜잭션이 확정된다.
    }
    catch(arr){ // 중간에 실패 시 이곳으로 이동함
        await connection.rollback(); // 중간에 문제 생기면 원상복구함
    }
    finally{
        connection.release(); // 문제가 있든 없든 열렸던 DB는 닫아야함
    }
}

saveDB("트랜잭션처리하기", "잘되나봅시다", "트랜잭션", "test.txt")
.then(() => {
    console.log("완료");
});