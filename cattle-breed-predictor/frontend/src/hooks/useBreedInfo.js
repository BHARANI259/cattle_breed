import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBreedInfo, deleteBreedCache } from '../api/axiosClient'

export function useBreedInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ breed_name, confidence }) => {
      const response = await fetchBreedInfo(breed_name, confidence)
      return response.data.breed_info
    },
    onSuccess: () => {
      // Invalidate cache list
      queryClient.invalidateQueries({ queryKey: ['breed-cache'] })
    },
  })
}

export function useClearBreedCache() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBreedCache,
    onSuccess: () => {
      // Invalidate cache list
      queryClient.invalidateQueries({ queryKey: ['breed-cache'] })
    },
  })
}
