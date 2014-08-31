#!/bin/bash


convert "$1"  -monochrome -morphology thicken '3x3:1,1,1,1,0,1,1,1,1' "$1"
