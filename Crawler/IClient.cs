using System.Threading.Tasks;
using System;
using Crawler.Results;

namespace Crawler
{
    public interface IClient
    {
        Task<Result> Get(Uri url);
    }
}
