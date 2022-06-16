export default function expand(data){
  return { name: "", type: "compound", value: expand2(data) };
}

function expand2(data){
  // console.log(data);
  const result = {};
  for (const key in data){
    const value = data[key];
    const type = getType(value);
    // console.log(key,value,type);
    result[key] = { type, value };
  }
  return result;
}

function getType(value){
  let type = typeof value;

  if (type === "object"){
    type = "compound";
  }

  if (type === "compound" && Array.isArray(value)){
    type = "list";
  }

  if (type === "number" && Number.isInteger(value)){
    console.log(value);
    if (value >= -128 && value <= 127){
      type = "byte";
      console.log("could be byte");
    }
    if (value >= -32768 && value <= 32767 && value < -128 && value > 127){
      type = "short";
      console.log("could be short");
    }
    if (value >= -2147483648 && value <= 2147483647 && value < -32768 && value > 32767){
      type = "int";
      console.log("could be int");
    }
  }

  if (type === "number" && !Number.isInteger(value)){
    console.log(value);
    if (value >= -3.40282347e+38 && value <= 3.40282347e+38){
      type = "float";
      console.log("could be float");
    }
    if (value >= -1.79769313486231570e+308 && value <= 1.79769313486231570e+308 && value < -3.40282347e+38 && value > 3.40282347e+38){
      type = "double";
      console.log("could be double");
    }
  }

  if (type === "bigint"){
    type = "long";
  }

  return type;
}