export enum Loc {
    Cafeteria = "CAFETERIA",
    Reactor = "REACTOR",
    UpperEngine = "UPPER_ENGINE",
    LowerEngine = "LOWER_ENGINE",
    Security = "SECURITY",
    MedBay = "MEDBAY",
    Electrical = "ELECTRICAL",
    Storage = "STORAGE",
    Admin = "ADMIN",
    Communications = "COMMUNICATIONS",
    O2 = "O2",
    Weapons = "WEAPONS",
    Shields = "SHIELDS",
    Navigation = "NAVIGATION"
}

export interface ILocation {
    /** Neighboring locations, acting as doors */
    doors: Loc[];
}

export const Locations: Record<Loc, ILocation> = {
    [Loc.Cafeteria]:      { doors: [ Loc.MedBay, Loc.Admin, Loc.Weapons ]                         },
    [Loc.Reactor]:        { doors: [ Loc.UpperEngine, Loc.Security, Loc.LowerEngine ]             },
    [Loc.UpperEngine]:    { doors: [ Loc.Reactor, Loc.Security, Loc.MedBay ]                      },
    [Loc.LowerEngine]:    { doors: [ Loc.Reactor, Loc.Security, Loc.Electrical ]                  },
    [Loc.Security]:       { doors: [ Loc.UpperEngine, Loc.LowerEngine, Loc.Reactor ]              },
    [Loc.MedBay]:         { doors: [ Loc.UpperEngine, Loc.Cafeteria ]                             },
    [Loc.Electrical]:     { doors: [ Loc.LowerEngine, Loc.Storage ]                               },
    [Loc.Storage]:        { doors: [ Loc.Electrical, Loc.Admin, Loc.Communications, Loc.Shields ] },
    [Loc.Admin]:          { doors: [ Loc.Cafeteria, Loc.Storage ]                                 },
    [Loc.Communications]: { doors: [ Loc.Storage, Loc.Shields ]                                   },
    [Loc.O2]:             { doors: [ Loc.Shields, Loc.Weapons, Loc.Navigation ]                   },
    [Loc.Weapons]:        { doors: [ Loc.Cafeteria, Loc.O2, Loc.Navigation ]                      },
    [Loc.Shields]:        { doors: [ Loc.Storage, Loc.Communications, Loc.O2, Loc.Navigation ]    },
    [Loc.Navigation]:     { doors: [ Loc.Weapons, Loc.O2, Loc.Shields ]                           }
}