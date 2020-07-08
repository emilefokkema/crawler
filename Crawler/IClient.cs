using System.Threading.Tasks;
using System;

namespace Crawler
{
    public interface IClient
    {
        Task<Result> Get(Uri url);
    }
}
