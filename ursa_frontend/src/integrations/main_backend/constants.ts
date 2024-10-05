/**
 * IDs of most locations.
 * 
 * bsc-deployment/otte_docker_deployment/db_creation_scripts/db_data_colony_asset.sql 
 * is the single source of truth.
 * 
 * As of right now, only some locations differ in how they're handled on the frontend (namely home and space port).
 */
export enum KnownLocations {
    OuterWalls = 10,
    SpacePort = 20,
    Home = 30,
    TownHall = 40,
    ShieldGenerators = 50,
    AquiferPlant = 60,
    AgricultureCenter = 70,
    VehicleStorage = 80,
    Cantina = 90,
    RadarDish = 100,
    MiningFacility = 110,
}