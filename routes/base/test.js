/**
 * Created by mumianhua on 2017/8/8.
 */
// var testAry=['yhj','lilin','wyz'];
// testAry.forEach(function(name,index,input){
//
// console.log(name+':'+index+':'+input);
// input[index]='good';
// });

let mytest=function (num) {
    let a=3;
    if(a>num){
        console.log('a 大于'+num);
    }else {
        mytest(num-a);
    }
}
mytest(9);