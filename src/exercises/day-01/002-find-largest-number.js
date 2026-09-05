export function findLargestNumber(values) {
  let largestNumber = values[0];
  for (const value of values) {
    if (value > largestNumber) {
      largestNumber = value;
      }
    }
}
