/* eslint-disable max-len */

/*
  Works with only numbers.
  After golang v1.21 this become a default sorting algorithm
  Logic copied from golang. Function written by me and optimized with chatgpt
  After optimizing I realized some different behaviors
  If someone uses this method, please contact with me and give me a feedback 🤞
  email: aliozendev@gmail.com
*/
const pdqsort = arr => {
  const sort = (arr, left, right, depth) => {
    if (left >= right) {
      return
    }

    // Insertion sort for smaller arrays
    if (right - left < 16) {
      insertionSort(arr, left, right)
      return
    }

    // Median-of-three pivot selection
    const pivotIndex = medianOfThree(arr, left, right)
    const pivot = arr[pivotIndex];
    [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]]

    const partitionIndex = partition(arr, left, right, pivot)

    // Recursively sort subarrays
    sort(arr, left, partitionIndex - 1, depth + 1)
    sort(arr, partitionIndex + 1, right, depth + 1)
  }

  sort(arr, 0, arr.length - 1, 0)
  return arr
}

const partition = (arr, left, right, pivot) => {
  let i = left
  let j = right - 1

  while (true) {
    while (i <= j && arr[i] < pivot) i++
    while (j >= i && arr[j] > pivot) j--
    if (i >= j) break;
    [arr[i], arr[j]] = [arr[j], arr[i]]
    i++
    j--
  }
  [arr[i], arr[right]] = [arr[right], arr[i]]
  return i
}

const medianOfThree = (arr, left, right) => {
  const center = Math.floor((left + right) / 2)
  if (arr[left] > arr[center]) [arr[left], arr[center]] = [arr[center], arr[left]]
  if (arr[left] > arr[right]) [arr[left], arr[right]] = [arr[right], arr[left]]
  if (arr[center] > arr[right]) [arr[center], arr[right]] = [arr[right], arr[center]]
  return center
}

const insertionSort = (arr, left, right) => {
  for (let i = left + 1; i <= right; i++) {
    const key = arr[i]
    let j = i - 1
    while (j >= left && arr[j] > key) {
      arr[j + 1] = arr[j]
      j--
    }
    arr[j + 1] = key
  }
}

export default pdqsort
