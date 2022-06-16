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
  return value;
}