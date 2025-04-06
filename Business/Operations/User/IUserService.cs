using Business.Operations.User.Dtos;
using NDogalApp.Business.Operations.User.Dtos;
using NDogalApp.Business.Types;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.User
{
    public interface IUserService
    {
        Task<ServiceMessage> RegisterUserAsync(AddUserDto userDto);
        Task<ServiceMessage<UserInfoDto>> LoginUserAsync(LoginUserDto loginDto);
        Task<ServiceMessage<List<UserInfoDto>>> GetAllUsersAsync();

        Task<ServiceMessage<UserInfoDto?>> GetUserByIdAsync(int userId);

        Task<ServiceMessage> UpdateUserAsync(int userId, UpdateUserDto dto);

        Task<ServiceMessage> DeleteUserAsync(int userId);
    }
}