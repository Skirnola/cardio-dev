export function findLargestNumber(values) {
  let largestNumber = values[0];
  for (const value of values) {
    if (value > largestNumber) {
      largestNumber = value;
      }
  }
  return largestNumber;
}

0,1,2,4,5
