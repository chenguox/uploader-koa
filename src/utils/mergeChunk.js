const fse = require("fs-extra");
const path = require('path')

/**
 * 合并切片
 * @param {*} mergePath 合并后输出的文件地址
 * @param {*} filename 文件名
 * @param {*} eachChunkSize 切片大小
 */
async function mergeChunk(mergePath, filename, eachChunkSize) {
  // 1、上传切片时存放的目录
  const chunkDir = path.join(__dirname, '../../uploads')
  console.log("mergePath:", mergePath)
  console.log('chunkDir:', chunkDir)
  // 2、读取该目录获取所有文件
  const chunkPaths = await fse.readdir(chunkDir);
  // 3、根据文件名后的索引按从小到大排序
  chunkPaths.sort((a, b) => a.split("_")[1] - b.split("_")[1]);
  
  await Promise.all(
    // 根据
    chunkPaths.map((chunk, index) => {
      // 每块分片的路径
      // const eachChunkPath = `${chunkDir}/${chunk}`;
      const eachChunkPath = path.join(chunkDir, chunk)
      console.log('eachChunkPath====:', eachChunkPath)
      // 为合并文件创建一个写入流
      const writeStream = fse.createWriteStream(mergePath, {
        start: index * eachChunkSize,
        // flags: 'r+',
      });

      // 将切片内容写入
      return pipeStream(eachChunkPath, writeStream);
    })
  );
  console.log('合并完成')
  fse.rmdirSync(chunkDir);
  console.log(`删除 ${chunkDir} 文件夹`);
}

let recordMergeInfo = {}; // 记录合并信息


/**
 *
 * @param {*} path
 * @param {*} writeStream
 */
function pipeStream(path, writeStream) {
  return new Promise((resolve) => {
    // 创建一个可读流（输出流），将切片内容读出再写入
    const readStream = fse.createReadStream(path);
    readStream.pipe(writeStream); // 输出通过管道流向输入
    readStream.on('data', (data) => {
    })

    readStream.on("end", () => {
      recordMergeInfo[path] = "finish";
      // console.log("recordMergeInfo:", recordMergeInfo)
      fse.unlinkSync(path); // 删除文件
      resolve();
      console.log(
        `合并 No.${path.split("_")[1]}`
      );
    });
  });
}


module.exports =  {
  mergeChunk,
  pipeStream
}