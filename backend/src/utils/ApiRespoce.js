class ApiResponce {
    constructor(status, message="Success ", data){
        this.statusCode=status;
        this.message=message;
        this.data=data;
        this.success=status < 400
    } 
}

export {ApiResponce};