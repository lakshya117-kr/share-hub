import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
      cb(null, file.fieldname)
    }
})

// so from here we get the localPath for the cloudnary to upload 

/* workflow: lets say u upload a file thrern multer first act as 
middleware and upload it in publictemp and return localPath then that 
loacalpath go  to cliudanary and then cloudanry uploads it to cloud and 
then return response and unlink the localPath (basically delete it) */


export const upload = multer({ storage, });