CREATE  TABLE "main"."Addon"
(
   "AddonId" VARCHAR PRIMARY KEY  NOT NULL  UNIQUE ,
   "AddonName" VARCHAR NOT NULL ,
   "AddonVersion" VARCHAR NOT NULL ,
   "AddonIcon" VARCHAR NOT NULL ,
   "IsDeactivated" BOOL NOT NULL ,
   "IsIncompatible" BOOL NOT NULL ,
   "IsRestartless" BOOL NOT NULL
)