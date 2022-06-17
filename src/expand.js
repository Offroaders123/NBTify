export default function expand(data){
  // return data;
  return { name: "", type: "compound", value: expand2(data) };
}

function expand2(data){
  // console.log(data);
  const result = {};
  for (const key in data){
    const { type, value } = getType(data[key]);
    // console.log(key,value,type);
    result[key] = { type, value };
  }
  return result;
}

const typeMap = {
  b: "byte",
  s: "short",
  l: "long",
  f: "float",
  d: "double"
};

function getType(value){
  let type = typeof value;

  if (type === "object"){
    type = Array.isArray(value) ? "list" : "compound";
  }

  if (type === "number"){
    type = "int";
  }

  if (type === "string"){
    let snbt = value.slice(-1);
    let content = value.slice(0,-1);
    if (!isNaN(content) && /[bslfd]/.test(snbt.toLowerCase())){
      type = typeMap[snbt];
      value = snbt === "long" ? BigInt(content) : Number(content);
      console.log("true! --",value,type);
    }
  }

  // console.log(type,value);
  return { type, value };
}