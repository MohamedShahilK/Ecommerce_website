// function removePdt(prodId) {

//     $.ajax({
//         url: '/cartPdtRemove/' + prodId,
//         method: 'get',
//         success: () => {
//             location.reload()
//         }
//     })
// }

// function removePdt(prodId,userId) {

//     $.ajax({
//         url: '/cartPdtRemove/'+prodId,
//         data:{
//             prodID : prodId,
//             userID : userId
//         },
//         method: 'post',
//         success: (res) => {
//             if(res.status){
//                 location.href='/cart'
//             }
//         }
//     })
// }

function removePdt(prodId,userId) {

    $.ajax({
        url: '/cartPdtRemove',
        data:{
            prodID : prodId,
            userID : userId
        },
        method: 'post',
        success: (res) => {
            if(res.status){
                location.href='/cart'
            }
        }
    })
}