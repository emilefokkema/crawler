using System;

namespace Crawler.UrlProcessor
{
    public interface IUrlProcessorFactory
    {
        UrlProcessor Create(Uri url);
    }
}
