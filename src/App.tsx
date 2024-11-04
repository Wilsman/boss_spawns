import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { DataMode, SpawnData } from '@/types';
import { fetchSpawnData } from '@/lib/api';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { ModeToggle } from '@/components/ModeToggle';
import { CacheStatus } from '@/components/CacheStatus';

export default function App() {
  const [mode, setMode] = useState<DataMode>('regular');
  const [regularData, setRegularData] = useState<SpawnData[] | null>(null);
  const [pveData, setPveData] = useState<SpawnData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapFilter, setMapFilter] = useState('');
  const [bossFilter, setBossFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [regular, pve] = await Promise.all([
          fetchSpawnData('regular'),
          fetchSpawnData('pve')
        ]);
        setRegularData(regular);
        setPveData(pve);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleExport = () => {
    const data = mode === 'regular' ? regularData : pveData;
    if (!data) return;

    const csvContent = [
      ['Map', 'Boss', 'Spawn Chance', 'Location', 'Location Chance'].join(','),
      ...data.flatMap((map: SpawnData) => 
        map.bosses.flatMap(boss => 
          boss.spawnLocations.map(location => 
            [
              map.normalizedName,
              boss.boss.normalizedName,
              `${Math.round(boss.spawnChance * 100)}%`,
              location.name,
              `${Math.round(location.chance * 100)}%`
            ].join(',')
          )
        )
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tarkov_spawns_${mode === 'regular' ? 'pvp' : mode}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Header />
        
        <div className="space-y-6 mb-8">
          <div className="flex justify-center gap-4">
            <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <CacheStatus mode="regular" />
            </div>
            <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <CacheStatus mode="pve" />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-gray-800/30 rounded-lg p-1">
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <FilterBar
              mapFilter={mapFilter}
              bossFilter={bossFilter}
              searchQuery={searchQuery}
              onMapFilterChange={setMapFilter}
              onBossFilterChange={setBossFilter}
              onSearchQueryChange={setSearchQuery}
              onExport={handleExport}
              data={mode === 'regular' ? regularData : pveData}
            />
          </div>
        </div>

        <div className="rounded-lg bg-gray-800/30 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <DataTable
              data={mode === 'regular' ? regularData : pveData}
              mode={mode}
              filters={{
                map: mapFilter,
                boss: bossFilter,
                search: searchQuery
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}