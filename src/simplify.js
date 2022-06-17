export default function simplify(data){
  const { type, value } = data;
  if (type === "compound"){
    const data = {};
    for (const key in value){
      data[key] = simplify(value[key]);
    }
    return data;
  }
  if (type === "list"){
    const { type } = value;
    return value.value.map(value => simplify({ type, value }));
  }
  // return value;
  // return type !== "string" && type !== "int" ? `${value}${type[0]}` : value;

  if (type === "string" || type === "int") return value;

  if (type === "byteArray"){
    return value.map(item => {
      return `${item}${type[0]}`;
    });
  }

  return `${value}${type[0]}`;
}