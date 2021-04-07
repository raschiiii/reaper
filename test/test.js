



(async () => {
    let promises = [];
    console.log("start");

    for (let i = 0; i < 10; i++){
        let p = new Promise((resolve, reject) => {
            setTimeout(resolve(i), 3000)
        });
        
        promises.push(p);
    }

    await Promise.all(promises).then((values) => {
        console.log(values)
    });

})();


