using Microsoft.EntityFrameworkCore; // DbSet, DbContext vs. için
using NDogalApp.Data.Context;      // NDogalDbContext için
using NDogalApp.Data.Entities;      // BaseEntity için
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;        // Task için
using System.Collections.Generic;    // List için

namespace NDogalApp.Data.Repositories
{
    // Generic Repository implementasyonu.
    public class Repository<TEntity> : IRepository<TEntity> where TEntity : BaseEntity
    {
        private readonly NDogalDbContext _db;
        private readonly DbSet<TEntity> _dbSet;

        // Constructor: DbContext'i Dependency Injection ile alır.
        public Repository(NDogalDbContext db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db)); // Null kontrolü
            _dbSet = _db.Set<TEntity>();
        }

        // --- Asenkron Implementasyonlar ---

        public async Task AddAsync(TEntity entity)
        {
            // CreatedTime ve ModifiedDate DbContext'teki SaveChanges interceptor'da ayarlanacak.
            // entity.CreatedTime = DateTime.UtcNow; // Burada ayarlamak yerine interceptor'a bırakmak daha merkezi.
            await _dbSet.AddAsync(entity);
            // Değişiklikleri burada kaydetmiyoruz! UnitOfWork kaydedecek.
            // await _db.SaveChangesAsync(); // YANLIŞ! UoW bunu yapmalı.
        }

        public Task UpdateAsync(TEntity entity)
        {
            // ModifiedDate DbContext'teki SaveChanges interceptor'da ayarlanacak.
            // entity.ModifiedDate = DateTime.UtcNow; // Interceptor yapacak.

            // Entity'nin state'ini Modified olarak işaretle.
            // Bu, hem normal güncellemeler hem de soft delete (isDeleted = true yapılmışsa) için çalışır.
            _dbSet.Update(entity); // Update metodu async değildir. State'i değiştirir sadece.

            // Eğer entity zaten takip edilmiyorsa (Attach durumu)
            // _db.Entry(entity).State = EntityState.Modified; // Alternatif

            return Task.CompletedTask; // Update async olmadığı için completed task dönülebilir.
            // await _db.SaveChangesAsync(); // YANLIŞ! UoW bunu yapmalı.
        }

        public async Task DeleteAsync(int id) // Soft Delete yapar
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                entity.isDeleted = true;
                // ModifiedDate interceptor tarafından ayarlanacak.
                // entity.ModifiedDate = DateTime.UtcNow; // Interceptor yapacak.
                await UpdateAsync(entity); // Update metodu çağrılarak state Modified yapılır.
            }
            // await _db.SaveChangesAsync(); // YANLIŞ! UoW bunu yapmalı.
        }

        public async Task HardDeleteAsync(int id) // Gerçekten siler
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                _dbSet.Remove(entity);
                // await _db.SaveChangesAsync(); // YANLIŞ! UoW bunu yapmalı.
            }
        }

        public Task HardDeleteAsync(TEntity entity)
        {
            _dbSet.Remove(entity);
            // SaveChanges yine UnitOfWork'te yapılacak.
            return Task.CompletedTask; // Remove async değil.
        }

        public async Task<TEntity?> GetByIdAsync(int id)
        {
            // HasQueryFilter (isDeleted = false) burada otomatik olarak uygulanır.
            return await _dbSet.FindAsync(id);
        }

        public async Task<TEntity?> GetAsync(Expression<Func<TEntity, bool>> predicate)
        {
            // HasQueryFilter (isDeleted = false) burada otomatik olarak uygulanır.
            return await _dbSet.FirstOrDefaultAsync(predicate);
        }

        public IQueryable<TEntity> GetAll(Expression<Func<TEntity, bool>>? predicate = null)
        {
            // HasQueryFilter (isDeleted = false) burada otomatik olarak uygulanır.
            // Sorguyu veritabanına göndermeden IQueryable olarak döndürür.
            // Business katmanı veya çağıran yer .ToListAsync(), .FirstOrDefaultAsync() vb. ile sorguyu çalıştırır.
            return predicate is null ? _dbSet : _dbSet.Where(predicate);
        }

        public async Task<List<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>>? predicate = null)
        {
            // HasQueryFilter (isDeleted = false) burada otomatik olarak uygulanır.
            // Sorguyu doğrudan çalıştırıp sonuçları List<TEntity> olarak döndürür.
            if (predicate is null)
            {
                return await _dbSet.ToListAsync();
            }
            else
            {
                return await _dbSet.Where(predicate).ToListAsync();
            }
        }
    }
}