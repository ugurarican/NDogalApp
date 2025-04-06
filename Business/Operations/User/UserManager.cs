using Business.Operations.User.Dtos;
using Microsoft.EntityFrameworkCore;       
using Microsoft.Extensions.Logging;          
using NDogalApp.Business.DataProtection;    
using NDogalApp.Business.Operations.User.Dtos; 
using NDogalApp.Business.Types;  
using NDogalApp.Data.Entities;               
using NDogalApp.Data.Enums;                  
using NDogalApp.Data.Repositories;           
using NDogalApp.Data.UnitOfWork;             
using System;
using System.Collections.Generic;             
using System.Linq;
using System.Security.Cryptography;          
using System.Threading.Tasks;                 

namespace NDogalApp.Business.Operations.User
{
    public class UserManager : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<UserEntity> _userRepository;
        private readonly NDogalApp.Business.DataProtection.IDataProtection _protector;
        private readonly ILogger<UserManager> _logger;

        public UserManager(
            IUnitOfWork unitOfWork,
            IRepository<UserEntity> userRepository,
            NDogalApp.Business.DataProtection.IDataProtection protector,
            ILogger<UserManager> logger)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _protector = protector ?? throw new ArgumentNullException(nameof(protector));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<ServiceMessage> RegisterUserAsync(AddUserDto userDto)
        {
            _logger.LogInformation("RegisterUserAsync çağrıldı: Email = {Email}", userDto?.Email);
            if (userDto == null) return new ServiceMessage { IsSucceed = false, Message = "Kullanıcı bilgileri boş olamaz." };

            try
            {
                // 1. Email adresi zaten var mı kontrol et
                var existingUser = await _userRepository.GetAsync(x => x.Email.ToLower() == userDto.Email.ToLower());
                if (existingUser != null)
                {
                    _logger.LogWarning("Kayıt başarısız: Email zaten kullanılıyor - {Email}", userDto.Email);
                    return new ServiceMessage { IsSucceed = false, Message = "Bu email adresi zaten kullanılıyor." };
                }

                // 2. Şifreyi şifrele
                if (string.IsNullOrEmpty(userDto.Password))
                    return new ServiceMessage { IsSucceed = false, Message = "Şifre boş olamaz." };
                string protectedPassword = _protector.Protect(userDto.Password);
                if (string.IsNullOrEmpty(protectedPassword))
                {
                    _logger.LogError("Şifre koruma başarısız (Protect boş döndü): Email = {Email}", userDto.Email);
                    return new ServiceMessage { IsSucceed = false, Message = "Kayıt sırasında kritik bir güvenlik hatası oluştu (P-Empty)." };
                }

                // 3. Yeni UserEntity oluştur
                var userEntity = new UserEntity()
                {
                    Email = userDto.Email,
                    FirstName = userDto.FirstName,
                    LastName = userDto.LastName,
                    Password = protectedPassword,
                    PhoneNumber = userDto.PhoneNumber,
                    Address = userDto.Address,
                    UserType = UserType.Customer // Varsayılan Müşteri
                };

                // 4. Repository'ye ekle
                await _userRepository.AddAsync(userEntity);

                // 5. Değişiklikleri Kaydet
                int result = await _unitOfWork.SaveChangesAsync();
                if (result > 0)
                {
                    _logger.LogInformation("Yeni kullanıcı başarıyla kaydedildi: Email = {Email}, UserID = {UserId}", userEntity.Email, userEntity.Id);
                    return new ServiceMessage { IsSucceed = true, Message = "Kayıt başarıyla tamamlandı." };
                }
                else
                {
                    _logger.LogWarning("Kullanıcı kaydı veritabanına yansımadı (SaveChangesAsync 0 döndü): {Email}", userDto.Email);
                    return new ServiceMessage { IsSucceed = false, Message = "Kullanıcı kaydı sırasında bilinmeyen bir hata oluştu (Save=0)." };
                }
            }
            catch (CryptographicException cryptoEx)
            {
                _logger.LogError(cryptoEx, "Kayıt sırasında şifreleme hatası oluştu: Email = {Email}", userDto?.Email);
                return new ServiceMessage { IsSucceed = false, Message = "Kayıt sırasında bir güvenlik hatası oluştu (Crypto)." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcı kaydı sırasında beklenmedik bir hata oluştu: Email = {Email}", userDto?.Email);
                return new ServiceMessage { IsSucceed = false, Message = "Kayıt sırasında bir sunucu hatası oluştu. Lütfen tekrar deneyin." };
            }
        }
        public async Task<ServiceMessage<UserInfoDto>> LoginUserAsync(LoginUserDto loginDto)
        {
            _logger.LogInformation("LoginUserAsync çağrıldı: Email = {Email}", loginDto?.Email);
            if (loginDto == null || string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Password))
                return new ServiceMessage<UserInfoDto> { IsSucceed = false, Message = "Email ve şifre boş olamaz." };

            try
            {
                // 1. Kullanıcıyı email ile bul
                var userEntity = await _userRepository.GetAsync(x => x.Email.ToLower() == loginDto.Email.ToLower());
                if (userEntity is null)
                {
                    _logger.LogWarning("Giriş başarısız: Kullanıcı bulunamadı - {Email}", loginDto.Email);
                    return new ServiceMessage<UserInfoDto> { IsSucceed = false, Message = "Kullanıcı adı veya şifre hatalı." };
                }

                // 2. Şifreyi çöz ve kontrol et
                string? unprotectedPassword = _protector.UnProtect(userEntity.Password);
                if (unprotectedPassword == null)
                {
                    _logger.LogError("Giriş hatası: Şifre çözülemedi - UserID = {UserId}", userEntity.Id);
                    return new ServiceMessage<UserInfoDto> { IsSucceed = false, Message = "Giriş sırasında bir güvenlik hatası oluştu. Yöneticiye başvurun (U)." };
                }

                // 3. Şifreleri karşılaştır
                if (unprotectedPassword == loginDto.Password)
                {
                    _logger.LogInformation("Giriş başarılı: UserID = {UserId}, Email = {Email}", userEntity.Id, userEntity.Email);
                    var userInfo = new UserInfoDto
                    {
                        Id = userEntity.Id,
                        Email = userEntity.Email,
                        FirstName = userEntity.FirstName,
                        LastName = userEntity.LastName,
                        UserType = userEntity.UserType,
                        PhoneNumber = userEntity.PhoneNumber,
                        Address = userEntity.Address
                    };
                    return new ServiceMessage<UserInfoDto> { IsSucceed = true, Data = userInfo, Message = "Giriş başarılı." };
                }
                else
                {
                    _logger.LogWarning("Giriş başarısız: Şifre hatalı - UserID = {UserId}", userEntity.Id);
                    return new ServiceMessage<UserInfoDto> { IsSucceed = false, Message = "Kullanıcı adı veya şifre hatalı." };
                }
            }
            catch (CryptographicException cryptoEx)
            {
                _logger.LogError(cryptoEx, "Giriş sırasında şifre çözme hatası: Email = {Email}", loginDto?.Email);
                return new ServiceMessage<UserInfoDto> { IsSucceed = false, Message = "Giriş sırasında bir güvenlik hatası oluştu (Crypto)." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Giriş sırasında beklenmedik bir hata oluştu: Email = {Email}", loginDto?.Email);
                return new ServiceMessage<UserInfoDto> { IsSucceed = false, Message = "Giriş sırasında bir sunucu hatası oluştu." };
            }
        }
        public async Task<ServiceMessage<List<UserInfoDto>>> GetAllUsersAsync()
        {
            _logger.LogInformation("GetAllUsersAsync çağrıldı (Admin işlemi).");
            try
            {
                var userEntities = await _userRepository.GetAll()
                                                        .OrderBy(u => u.FirstName)
                                                        .ThenBy(u => u.LastName)
                                                        .ToListAsync();
                var userInfoDtos = userEntities.Select(u => new UserInfoDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    UserType = u.UserType,
                    PhoneNumber = u.PhoneNumber,
                    Address = u.Address
                }).ToList();
                _logger.LogInformation("{UserCount} adet kullanıcı bilgisi başarıyla getirildi.", userInfoDtos.Count);
                return new ServiceMessage<List<UserInfoDto>> { IsSucceed = true, Data = userInfoDtos };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tüm kullanıcılar getirilirken bir veritabanı hatası oluştu.");
                return new ServiceMessage<List<UserInfoDto>> { IsSucceed = false, Message = "Kullanıcı listesi alınırken sunucuda bir hata oluştu.", Data = null };
            }
        }
        public async Task<ServiceMessage<UserInfoDto?>> GetUserByIdAsync(int userId)
        {
            _logger.LogInformation("GetUserByIdAsync çağrıldı: UserID = {UserId}", userId);
            if (userId <= 0) return new ServiceMessage<UserInfoDto?> { IsSucceed = false, Message = "Geçersiz kullanıcı ID.", Data = null };
            try
            {
                var userEntity = await _userRepository.GetByIdAsync(userId);
                if (userEntity == null)
                {
                    _logger.LogWarning("GetUserByIdAsync: Kullanıcı bulunamadı - UserID = {UserId}", userId);
                    return new ServiceMessage<UserInfoDto?> { IsSucceed = false, Message = "Kullanıcı bulunamadı.", Data = null };
                }
                var userInfoDto = new UserInfoDto
                {
                    Id = userEntity.Id,
                    Email = userEntity.Email,
                    FirstName = userEntity.FirstName,
                    LastName = userEntity.LastName,
                    UserType = userEntity.UserType,
                    PhoneNumber = userEntity.PhoneNumber,
                    Address = userEntity.Address
                };
                _logger.LogInformation("GetUserByIdAsync başarıyla kullanıcıyı buldu: UserID = {UserId}", userId);
                return new ServiceMessage<UserInfoDto?> { IsSucceed = true, Data = userInfoDto };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetUserByIdAsync sırasında hata: UserID = {UserId}", userId);
                return new ServiceMessage<UserInfoDto?> { IsSucceed = false, Message = "Kullanıcı bilgileri getirilirken bir hata oluştu.", Data = null };
            }
        }
        public async Task<ServiceMessage> UpdateUserAsync(int userId, UpdateUserDto dto)
        {
            _logger.LogInformation("UpdateUserAsync çağrıldı: UserID = {UserId}", userId);
            if (userId <= 0) return new ServiceMessage { IsSucceed = false, Message = "Geçersiz kullanıcı ID." };
            if (dto == null) return new ServiceMessage { IsSucceed = false, Message = "Güncelleme verileri boş olamaz." };

            try
            {
                var userEntity = await _userRepository.GetByIdAsync(userId);
                if (userEntity == null)
                {
                    _logger.LogWarning("UpdateUserAsync: Güncellenecek kullanıcı bulunamadı - UserID = {UserId}", userId);
                    return new ServiceMessage { IsSucceed = false, Message = "Güncellenecek kullanıcı bulunamadı." };
                }

                userEntity.FirstName = dto.FirstName;
                userEntity.LastName = dto.LastName;
                userEntity.PhoneNumber = dto.PhoneNumber;
                userEntity.Address = dto.Address;
                userEntity.UserType = dto.UserType;

                await _userRepository.UpdateAsync(userEntity);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation("Kullanıcı başarıyla güncellendi: UserID = {UserId}", userId);
                return new ServiceMessage { IsSucceed = true, Message = "Kullanıcı bilgileri başarıyla güncellendi." };
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "UpdateUserAsync sırasında eş zamanlılık hatası (concurrency): UserID = {UserId}", userId);
                return new ServiceMessage { IsSucceed = false, Message = "Kayıt başka bir işlem tarafından değiştirildiği için güncellenemedi. Lütfen tekrar deneyin." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateUserAsync sırasında beklenmedik hata: UserID = {UserId}", userId);
                return new ServiceMessage { IsSucceed = false, Message = "Kullanıcı güncellenirken bir hata oluştu." };
            }
        }
        public async Task<ServiceMessage> DeleteUserAsync(int userId)
        {
            _logger.LogInformation("DeleteUserAsync çağrıldı: UserID = {UserId}", userId);
            if (userId <= 0) return new ServiceMessage { IsSucceed = false, Message = "Geçersiz kullanıcı ID." };

            try
            {
                await _userRepository.DeleteAsync(userId); // Soft delete
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation("Kullanıcı başarıyla silindi (soft delete): UserID = {UserId}", userId);
                // Repository'nin DeleteAsync'i bulamazsa hata vermez, başarılı kabul edilir.
                return new ServiceMessage { IsSucceed = true, Message = "Kullanıcı başarıyla silindi." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeleteUserAsync sırasında beklenmedik hata: UserID = {UserId}", userId);
                return new ServiceMessage { IsSucceed = false, Message = "Kullanıcı silinirken bir hata oluştu." };
            }
        }
    }
}