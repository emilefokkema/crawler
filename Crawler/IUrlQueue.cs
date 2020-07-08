using System;

namespace Crawler
{
    public interface IUrlQueue
    {
        bool TryRead(out Uri url);
        void Add(Uri url);
    }
}
