using System.Threading.Tasks;

namespace Crawler
{
    public interface IClient
    {
        Task Get(string url);
    }
}
