using NDogalApp.Business.Operations.Basket.Dtos;
using NDogalApp.Business.Types;
using System;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Basket
{
    public interface IBasketService
    {
        // Belirtilen kullanıcının sepetini getirir.
        Task<ServiceMessage<BasketDto>> GetBasketByUserIdAsync(int userId);

        // Kullanıcının sepetine ürün ekler veya mevcut ürünün miktarını artırır.
        Task<ServiceMessage> AddItemToBasketAsync(AddItemToBasketDto itemDto);

        // Sepetteki bir ürünün miktarını günceller.
        Task<ServiceMessage> UpdateBasketItemQuantityAsync(UpdateBasketItemDto itemDto);

        // Sepetten bir ürünü kaldırır.
        Task<ServiceMessage> RemoveItemFromBasketAsync(RemoveBasketItemDto itemDto);

        // Kullanıcının sepetini tamamen boşaltır.
        Task<ServiceMessage> ClearBasketAsync(int userId);
    }
}