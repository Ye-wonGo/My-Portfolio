const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL
const apiCandidates = configuredBase
  ? [configuredBase]
  : ["https://my-portfolio-rjwi.onrender.com", "", "http://localhost:5000"]

export async function uploadImageFiles(files: File[]): Promise<string[]> {
  if (!files.length) return []

  for (const baseUrl of apiCandidates) {
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("images", file)
      })

      const response = await fetch(`${baseUrl}/api/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Upload error text:", errorText)
        continue
      }

      const data = await response.json()
      return Array.isArray(data?.urls) ? data.urls : []
    } catch (e) {
      console.error("Upload error for API:", baseUrl, e)
      continue
    }
  }

  throw new Error("이미지 업로드에 실패했습니다.")
}

export async function uploadPdfFile(file: File): Promise<string> {
  for (const baseUrl of apiCandidates) {
    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const response = await fetch(`${baseUrl}/api/upload-pdf`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Upload error text:", errorText)
        continue
      }

      const data = await response.json()
      if (typeof data?.url === "string" && data.url.trim() !== "") {
        return data.url
      }
    } catch (e) {
      console.error("Upload error for API:", baseUrl, e)
      continue
    }
  }

  throw new Error("PDF 업로드에 실패했습니다.")
}
