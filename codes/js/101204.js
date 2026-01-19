// // 하
// // 1. 현재 시간을 화면에 표시
//     let contry = 0
//     const KOR = document.createElement('button')
//     KOR.addEventListener('click', () => {contry = 0;date=swt()})
//     const USA = document.createElement('button')
//     USA.addEventListener('click', () =>{contry = 1;date=swt()})
//     const UK = document.createElement('button')
//     UK.addEventListener('click', () => {contry = 2;date=swt()})
//     const BR = document.createElement('br')
//     KOR.textContent = '한국'
//     USA.textContent = '미국'
//     UK.textContent = '영국'
//     document.body.appendChild(KOR)
//     document.body.appendChild(USA)
//     document.body.appendChild(UK)
//     document.body.appendChild(BR)

//     let date = new Date()
//     let swt = () => {
//         switch(contry){
//         case '0':
//             date.toLocaleTimeString()
//             break;
//         case '1':
//             date.toLocaleTimeString('en-US')
//             break;
//         case '2':
//             break;
//         } 
//     } 
//     const TIME = document.createElement('p')

//     let h = date.getHours()
//     let m = date.getMinutes()
//     let s = date.getSeconds()
//     TIME.textContent = '현재 시각'+h+':'+m+':'+s
//     document.body.appendChild(TIME)


// // 중하
// // 2. 실시간으로 시간을 화면에 표시
//     let inter = setInterval(() => TIME.innerHTML = new Date(),1000)
// // 중하
// // 3. 멈춰 버튼을 누르면, 시간이 정지할 것
//     const STOP = document.createElement('button')
//     STOP.textContent = '멈춰'
//     STOP.addEventListener('click', () => clearInterval(inter))
//     document.body.appendChild(STOP)
// // 중상
// // 4. 재시작 버튼을 누르면, 버튼을 누른 시점의 시간부터 다시 실시간으로 화면에 표시
//     const REPLAY = document.createElement('button')
//     REPLAY.textContent = '재시작'
//     REPLAY.addEventListener('click',() => inter = setInterval(() => TIME.innerHTML = new Date(),1000))
//     document.body.appendChild(REPLAY);
//  내꺼 너무 복잡하게 하려함 => 욕심
//  차라리 내가 빨리 이해하고(with chatgpt) 주변사람들꺼 보고 같이 이해하는게 낫다.


// 쌤꺼
    const PRINTTIME = document.getElementById('clock');
    
    // let interval;
    // startTime();
    
    // let date;
    // const NOW = new Date();
    // let NOWUSA =  new Date();
    // NOWUSA.setTime( NOW - (1000*60*60*13));
    // let now_usa = NOWUSA.toLocaleTimeString();
    // PRINTTIME.innerHTML = now_usa;

    function TIME(){
        const NOW = new Date(); 
        // const는 값을 재지정은 못하지만 
        // 애초에 선언한걸 다시실행하는 건 상관 없는듯(선언값 다시 받아들이기)
        PRINTTIME.innerHTML = NOW.toLocaleTimeString();
        let NOWUSA =  new Date();
        NOWUSA.setTime( NOW - (1000*60*60*13));
        let now_usa = NOWUSA.toLocaleTimeString();
        PRINTTIME.innerHTML = now_usa;
    } 

    interval = setInterval(TIME,1000); 

    function stopTime(){
        clearInterval(interval); // 클리어는 또 setInterval 그대로 보내야 함
    }

    const BTNSTOP = document.getElementById('btn-stop');
    BTNSTOP.addEventListener('click', stopTime);

    function startTime(){
        interval = setInterval(TIME,1000); 
    }

    const BTNRESTART = document.getElementById('btn-restart');
    BTNRESTART.addEventListener('click', startTime);

