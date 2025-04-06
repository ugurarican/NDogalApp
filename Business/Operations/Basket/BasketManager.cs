using Microsoft.EntityFrameworkCore;
using NDogalApp.Business.Operations.Basket.Dtos;
using NDogalApp.Business.Types;
using NDogalApp.Data.Entities;
using NDogalApp.Data.Repositories;
using NDogalApp.Data.UnitOfWork;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Basket
{
    public class BasketManager : IBasketService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<BasketEntity> _basketRepository;
        private readonly IRepository<BasketItemEntity> _basketItemRepository;
        private readonly IRepository<ProductEntity> _productRepository;

        public BasketManager(
            IUnitOfWork unitOfWork,
            IRepository<BasketEntity> basketRepository,
            IRepository<BasketItemEntity> basketItemRepository,
            IRepository<ProductEntity> productRepository)
        {
            _unitOfWork = unitOfWork;
            _basketRepository = basketRepository;
            _basketItemRepository = basketItemRepository;
            _productRepository = productRepository;
        }

        // Kullanıcının sepetini veya yoksa boş bir sepet DTO'su getirir.
        public async Task<ServiceMessage<BasketDto>> GetBasketByUserIdAsync(int userId)
        {
            var basket = await _basketRepository
                                .GetAll(b => b.UserId == userId)
                                .Include(b => b.BasketItems) // Sepet öğelerini dahil et
                                    .ThenInclude(bi => bi.Product) // Sepet öğelerindeki ürünleri dahil et
                                .FirstOrDefaultAsync();

            BasketDto basketDto;

            if (basket == null)
            {
                // Kullanıcının henüz bir sepeti yoksa boş DTO döndür
                basketDto = new BasketDto { UserId = userId };
            }
            else
            {
                // Entity'yi DTO'ya map'le
                basketDto = new BasketDto
                {
                    Id = basket.Id,
                    UserId = basket.UserId,
                    Items = basket.BasketItems.Select(bi => new BasketItemDto
                    {
                        Id = bi.Id,
                        ProductId = bi.ProductId,
                        ProductName = bi.Product.Name, // İlişkili üründen adı al
                        Quantity = bi.Quantity,
                        UnitPrice = bi.Product.Price, // İlişkili üründen fiyatı al
                        ProductImageUrl = bi.Product.ImageUrl
                    }).ToList()
                };
            }

            return new ServiceMessage<BasketDto> { IsSucceed = true, Data = basketDto };
        }

        // Sepete ürün ekler/günceller
        public async Task<ServiceMessage> AddItemToBasketAsync(AddItemToBasketDto itemDto)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // 1. Ürün var mı ve stok yeterli mi kontrol et
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Ürün bulunamadı." };
                }
                if (product.StockQuantity < itemDto.Quantity || itemDto.Quantity <= 0)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = itemDto.Quantity <= 0 ? "Eklenecek miktar 0'dan büyük olmalı." : "Yetersiz stok." };
                }

                // 2. Kullanıcının sepetini bul veya oluştur
                var basket = await _basketRepository.GetAsync(b => b.UserId == itemDto.UserId);
                if (basket == null)
                {
                    basket = new BasketEntity { UserId = itemDto.UserId };
                    await _basketRepository.AddAsync(basket);
                }

                // 3. Bu ürün sepette zaten var mı kontrol et
                // Basket Id henüz belli olmayabilir, UserId ve ProductId ile kontrol et.
                var basketItem = await _basketItemRepository
                                      .GetAsync(bi => bi.Basket.UserId == itemDto.UserId && bi.ProductId == itemDto.ProductId);


                if (basketItem != null)
                {
                    // Ürün sepette var, miktarını güncelle
                    int newQuantity = basketItem.Quantity + itemDto.Quantity;
                    if (product.StockQuantity < newQuantity) // Tekrar stok kontrolü (toplam miktar için)
                    {
                        await _unitOfWork.RollbackTransactionAsync();
                        return new ServiceMessage { IsSucceed = false, Message = "Yetersiz stok (mevcut sepet miktarı ile birlikte)." };
                    }
                    basketItem.Quantity = newQuantity;
                    await _basketItemRepository.UpdateAsync(basketItem);
                }
                else
                {
                    // Ürün sepette yok, yeni BasketItemEntity oluştur
                    basketItem = new BasketItemEntity
                    {
                        Basket = basket,
                        ProductId = itemDto.ProductId,
                        Quantity = itemDto.Quantity
                    };
                    await _basketItemRepository.AddAsync(basketItem);
                }

                // 4. Değişiklikleri kaydet ve transaction'ı commit et
                await _unitOfWork.CommitTransactionAsync();
                return new ServiceMessage { IsSucceed = true, Message = "Ürün sepete eklendi." };

            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Sepete ürün eklenirken bir hata oluştu." };
            }
        }


        // Sepetteki ürün miktarını güncelleme
        public async Task<ServiceMessage> UpdateBasketItemQuantityAsync(UpdateBasketItemDto itemDto)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // 1. Güncellenecek sepet öğesini bul (UserId ile birlikte kontrol et)
                var basketItem = await _basketItemRepository
                                        .GetAsync(bi => bi.Id == itemDto.BasketItemId && bi.Basket.UserId == itemDto.UserId);

                if (basketItem == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Sepet öğesi bulunamadı veya yetkiniz yok." };
                }

                // 2. Yeni miktar geçerli mi (0'dan büyük mü?)
                if (itemDto.NewQuantity <= 0)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = "Miktar 0'dan büyük olmalıdır. Ürünü kaldırmak için silme işlemini kullanın." };
                }

                // 3. Ürün stoğunu kontrol et
                var product = await _productRepository.GetByIdAsync(basketItem.ProductId);
                if (product == null || product.StockQuantity < itemDto.NewQuantity)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = false, Message = product == null ? "Ürün bulunamadı." : "Yetersiz stok." };
                }

                // 4. Miktarı güncelle ve kaydet
                basketItem.Quantity = itemDto.NewQuantity;
                await _basketItemRepository.UpdateAsync(basketItem);
                await _unitOfWork.CommitTransactionAsync();

                return new ServiceMessage { IsSucceed = true, Message = "Sepet miktarı güncellendi." };
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Sepet güncellenirken bir hata oluştu." };
            }
        }

        // Sepetten ürün silme
        public async Task<ServiceMessage> RemoveItemFromBasketAsync(RemoveBasketItemDto itemDto)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // 1. Silinecek sepet öğesini bul (UserId ile birlikte kontrol et)
                var basketItem = await _basketItemRepository
                                        .GetAsync(bi => bi.Id == itemDto.BasketItemId && bi.Basket.UserId == itemDto.UserId);

                if (basketItem == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = true }; 
                }

                // 2. Öğeyi kalıcı olarak sil (Hard Delete) ve kaydet
                await _basketItemRepository.HardDeleteAsync(basketItem);
                await _unitOfWork.CommitTransactionAsync();

                return new ServiceMessage { IsSucceed = true, Message = "Ürün sepetten kaldırıldı." };
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Sepetten ürün kaldırılırken bir hata oluştu." };
            }
        }

        // Sepeti boşaltma
        public async Task<ServiceMessage> ClearBasketAsync(int userId)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // 1. Kullanıcının sepetini ve öğelerini bul
                var basket = await _basketRepository
                                    .GetAll(b => b.UserId == userId)
                                    .Include(b => b.BasketItems)
                                    .FirstOrDefaultAsync();

                if (basket == null || !basket.BasketItems.Any())
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return new ServiceMessage { IsSucceed = true };
                }

                // 2. Tüm sepet öğelerini sil (Hard Delete)
                foreach (var item in basket.BasketItems.ToList())
                {
                    await _basketItemRepository.HardDeleteAsync(item);
                }

                // 3. Değişiklikleri kaydet
                await _unitOfWork.CommitTransactionAsync();
                return new ServiceMessage { IsSucceed = true, Message = "Sepet temizlendi." };

            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Sepet temizlenirken bir hata oluştu." };
            }
        }
    }
}