import { User } from "../user"


// 这个函数会根据id来新建一个User对象并返回
export function getUser(ids:string) : User  {
    return {
        id:ids,
        index:0
    }
}