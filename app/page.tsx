'use client';
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

type Team = {
  color: string;
  name: string;
  players: string[];
};

const TEAMS: Team[] = [
  { color: '#00FFFF', name: 'Cian', players: [] },
  { color: '#FF0000', name: 'Rojo', players: [] },
  { color: '#22C55E', name: 'Verde', players: [] },
  { color: '#FFFFFF', name: 'Blanco', players: [] },
  { color: '#87CEEB', name: 'Celeste', players: [] },
  { color: '#F97316', name: 'Naranja', players: [] },
];

export default function Home() {
  const [teams, setTeams] = useState<Team[]>(TEAMS);
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedPlayers = localStorage.getItem('players');
    const storedTeams = localStorage.getItem('teams');
    
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }
    
    if (storedTeams) {
      setTeams(JSON.parse(storedTeams));
    }
  }, []);

  const addPlayer = () => {
    if (newPlayer.trim()) {
      const updatedPlayers = [...players, newPlayer.trim()];
      setPlayers(updatedPlayers);
      localStorage.setItem('players', JSON.stringify(updatedPlayers));
      setNewPlayer('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  const deletePlayer = (playerToDelete: string) => {
    const updatedPlayers = players.filter(player => player !== playerToDelete);
    setPlayers(updatedPlayers);
    localStorage.setItem('players', JSON.stringify(updatedPlayers));
  };

  const assignPlayer = (player: string, teamName: string) => {
    const updatedTeams = teams.map(team => {
      if (team.name === teamName && team.players.length < 7) {
        return { ...team, players: [...team.players, player] };
      }
      return team;
    });
    
    setTeams(updatedTeams);
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
    
    const updatedPlayers = players.filter(p => p !== player);
    setPlayers(updatedPlayers);
    localStorage.setItem('players', JSON.stringify(updatedPlayers));
  };

  const removePlayer = (player: string, teamName: string) => {
    const updatedTeams = teams.map(team => {
      if (team.name === teamName) {
        return { ...team, players: team.players.filter(p => p !== player) };
      }
      return team;
    });
    
    setTeams(updatedTeams);
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
    
    const updatedPlayers = [...players, player];
    setPlayers(updatedPlayers);
    localStorage.setItem('players', JSON.stringify(updatedPlayers));
  };

  const removeAllPlayers = () => {
    if (window.confirm('¿Estás seguro que deseas eliminar todos los jugadores?')) {
      setPlayers([]);
      localStorage.setItem('players', JSON.stringify([]));
      
      const resetTeams = teams.map(team => ({ ...team, players: [] }));
      setTeams(resetTeams);
      localStorage.setItem('teams', JSON.stringify(resetTeams));
    }
  };

  const downloadTeams = async () => {
    // Create a temporary container for non-empty teams
    const tempContainer = document.createElement('div');
    tempContainer.style.display = 'grid';
    tempContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    tempContainer.style.gap = '20px';
    tempContainer.style.padding = '20px';
    tempContainer.style.background = '#111827'; // Dark background
    tempContainer.style.borderRadius = '12px';

    // Get only the teams with players
    const teamsWithPlayers = teams.filter(team => team.players.length > 0);
    
    // Clone the team cards that have players
    teamsWithPlayers.forEach(team => {
      const teamElement = document.querySelector(`[data-team="${team.name}"]`);
      if (teamElement) {
        tempContainer.appendChild(teamElement.cloneNode(true));
      }
    });

    // Add the temporary container to the document (hidden)
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    try {
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#111827' // Ensure dark background in the image
      });
      const link = document.createElement('a');
      link.download = 'equipos.png';
      link.href = canvas.toDataURL();
      link.click();
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Filter out empty values and get unique players
          const newPlayers = Array.from(new Set(
            jsonData.flat()
              .map(player => String(player).trim())
              .filter(player => player && player.length > 0)
          ));

          // Combine with existing players, removing duplicates
          const updatedPlayers = Array.from(new Set([...players, ...newPlayers]));
          setPlayers(updatedPlayers);
          localStorage.setItem('players', JSON.stringify(updatedPlayers));

          // Reset the input
          event.target.value = '';
        } catch (error) {
          console.error('Error al importar el archivo:', error);
          alert('Error al importar el archivo. Asegúrate de que sea un archivo Excel válido.');
        }
      };
      reader.onerror = () => {
        alert('Error al leer el archivo');
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>¡Vamos Kaduregel!</h1>
      
      <div className={styles.mainContent}>
        <div className={styles.playersSection}>
          <div className={styles.playersPool}>
            <h2>Jugadores Disponibles</h2>
            <div className={styles.searchContainer}>
              <div className={styles.searchGroup}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar jugador..."
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className={styles.clearSearch}
                    aria-label="Limpiar búsqueda"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      width="16"
                      height="16"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
              <button 
                onClick={removeAllPlayers}
                className={styles.removeAllButton}
                aria-label="Eliminar todos los jugadores"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  width="16"
                  height="16"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Eliminar Todos
              </button>
            </div>
            <div className={styles.playersList}>
              {filteredPlayers.map((player) => (
                <div key={player} className={styles.playerCard}>
                  <div className={styles.playerHeader}>
                    <span>{player}</span>
                    <div className={styles.playerActions}>
                      <button 
                        onClick={() => deletePlayer(player)}
                        className={styles.deleteButton}
                        aria-label="Eliminar jugador"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          width="16"
                          height="16"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                      <div className={styles.dropdownContainer}>
                        <button 
                          className={styles.dropdownButton}
                          onClick={(e) => {
                            e.currentTarget.nextElementSibling?.classList.toggle(styles.show);
                          }}
                          aria-label="Asignar a equipo"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            width="16" 
                            height="16"
                          >
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                        <div className={styles.dropdownContent}>
                          {teams.map((team) => (
                            team.players.length < 7 && (
                              <button
                                key={team.name}
                                onClick={() => {
                                  assignPlayer(player, team.name);
                                  // Close dropdown after selection
                                  const dropdowns = document.getElementsByClassName(styles.dropdownContent);
                                  Array.from(dropdowns).forEach(dropdown => 
                                    dropdown.classList.remove(styles.show)
                                  );
                                }}
                                className={styles.dropdownItem}
                                style={{ 
                                  backgroundColor: team.color,
                                  color: team.color === '#FFFFFF' ? '#000000' : '#FFFFFF'
                                }}
                              >
                                {team.name} ({team.players.length}/7)
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.addPlayerSection}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nombre del jugador"
                className={styles.input}
              />
              <button onClick={addPlayer} className={styles.button}>
                Agregar Jugador
              </button>
            </div>
            <div className={styles.importSection}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className={styles.fileInput}
                id="fileInput"
              />
              <label htmlFor="fileInput" className={styles.importButton}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  width="16"
                  height="16"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Importar Excel
              </label>
            </div>
          </div>
        </div>

        <div id="teams-container" className={styles.teamsContainer}>
          {teams.map((team) => (
            <div
              key={team.name}
              data-team={team.name}
              className={styles.teamCard}
              style={{ backgroundColor: team.color }}
            >
              <h3 style={{ color: team.color === '#FFFFFF' ? '#000000' : '#FFFFFF' }}>
                {team.name} ({team.players.length}/7)
              </h3>
              <div className={styles.teamPlayers}>
                {team.players.map((player) => (
                  <div
                    key={player}
                    className={styles.teamPlayer}
                    onClick={() => removePlayer(player, team.name)}
                    style={{ color: team.color === '#FFFFFF' ? '#000000' : '#FFFFFF' }}
                  >
                    {player}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={downloadTeams} className={styles.downloadButton}>
        Descargar Equipos
      </button>
    </div>
  );
}
