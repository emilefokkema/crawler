using System.Threading.Tasks;

namespace Crawler
{
    public interface IClient
    {
        Task<Result> Get(string url);
    }
}
