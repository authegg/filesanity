import { Head } from '../ui'

export const meta = { title: 'Page not found', description: 'This page does not exist on FileSanity.' }
export const index = false

export default function NotFound() {
  return (
    <Head h1="Nothing at this address." lede={<>The page may have moved. <a href="/">Start at the home page</a>, or clean a file there.</>} />
  )
}
