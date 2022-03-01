export function decode(array){
  const string = new TextDecoder("utf-8").decode(array);
  return string;
}

export function encode(string){
  const array = new TextEncoder().encode(string);
  return array;
}