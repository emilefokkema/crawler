namespace Crawler
{
    public interface IUrlQueue
    {
        bool TryRead(out string url);
        void Add(string url);
    }
}
