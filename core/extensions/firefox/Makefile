PROFILE_ARG=''

ifdef PROFILE
	PROFILE_ARG = -p $(PROFILE)
endif

run:
	# I usually run with: `PROFILE=/path/to/dev/profile make run`.
	cd addon-sdk && . bin/activate && cd .. && cfx run $(PROFILE_ARG)

build:
	cd addon-sdk && . bin/activate && cd .. && cfx xpi

clean:
	rm webglinspector.xpi

