import { useMutation, useQueryClient } from '@tanstack/react-query'
import { predictBreed } from '../api/axiosClient'

export function usePrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await predictBreed(formData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate history to show new prediction
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })
}
