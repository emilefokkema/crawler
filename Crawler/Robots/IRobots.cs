using System.Threading.Tasks;

namespace Crawler.Robots
{
    public interface IRobots
    {
        Task AddRulesToDomain(Domain domain);
    }
}
