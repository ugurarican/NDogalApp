using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using NDogalApp.Data.Entities;

namespace NDogalApp.Data.Repositories
{
    public interface IRepository<TEntity> where TEntity : BaseEntity
    {

        Task AddAsync(TEntity entity);
        Task UpdateAsync(TEntity entity); // Hem güncelleme hem de soft delete için kullanılabilir
        Task DeleteAsync(int id);         // Soft delete işlemini yapar
        Task HardDeleteAsync(int id);     // Gerçekten veritabanından silme 
        Task HardDeleteAsync(TEntity entity); // Entity'yi doğrudan silmek için

        Task<TEntity?> GetByIdAsync(int id); // Null dönebilir
        Task<TEntity?> GetAsync(Expression<Func<TEntity, bool>> predicate); // Null dönebilir

        IQueryable<TEntity> GetAll(Expression<Func<TEntity, bool>>? predicate = null);

        Task<List<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>>? predicate = null);
    }
}