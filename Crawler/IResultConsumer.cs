using Crawler.Results;

namespace Crawler
{
    public interface IResultConsumer
    {
        void Consume(Result result);
    }
}
